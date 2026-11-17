"""Independent real-browser acceptance on the guarded disposable stack only.

Uses installed Chrome + existing websockets; no dependency installation, no .env,
no secrets in output, no hosted calls. All users/Workspaces created here are removed.
"""

import base64
import json
from pathlib import Path
import re
import secrets
import shutil
import subprocess
import sys
import tempfile
import time
from html import unescape
from uuid import uuid4

import httpx
from websockets.sync.client import connect

MAIN = Path(__file__).resolve().parents[4]
WORK = MAIN / '.tmp/mship'
sys.path.insert(0, str(WORK / 'scripts/membership'))
from local_stack import API, sql, status

BASE = 'http://127.0.0.1:57300'
BACKEND = 'http://127.0.0.1:58000'
ARTIFACTS = Path(__file__).resolve().parent


class Browser:
    def __init__(self):
        self.profile = Path(tempfile.mkdtemp(prefix='castra-membership-audit-')).resolve()
        self.process = subprocess.Popen([
            'C:/Program Files/Google/Chrome/Application/chrome.exe', '--headless=new',
            '--no-first-run', '--no-default-browser-check', '--disable-extensions',
            '--remote-debugging-port=57390', '--user-data-dir=' + str(self.profile),
            'about:blank',
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
           creationflags=subprocess.CREATE_NO_WINDOW)
        deadline = time.monotonic() + 20
        while True:
            try:
                endpoint = httpx.get('http://127.0.0.1:57390/json/version', timeout=1).json()
                break
            except (httpx.HTTPError, ValueError):
                if time.monotonic() >= deadline:
                    raise RuntimeError('Isolated browser startup failed.') from None
                time.sleep(0.15)
        self.socket = connect(endpoint['webSocketDebuggerUrl'], max_size=8 * 1024 * 1024)
        self.sequence = 0

    def call(self, method, params=None, session=None):
        self.sequence += 1
        message = {'id': self.sequence, 'method': method, 'params': params or {}}
        if session:
            message['sessionId'] = session
        self.socket.send(json.dumps(message))
        while True:
            reply = json.loads(self.socket.recv(timeout=30))
            if reply.get('id') == self.sequence:
                if 'error' in reply:
                    raise RuntimeError('Browser protocol operation failed: ' + method)
                return reply.get('result', {})

    def page(self):
        context = self.call('Target.createBrowserContext')['browserContextId']
        target = self.call('Target.createTarget', {'url': BASE, 'browserContextId': context})['targetId']
        session = self.call('Target.attachToTarget', {'targetId': target, 'flatten': True})['sessionId']
        self.call('Page.enable', session=session)
        self.call('Runtime.enable', session=session)
        return session

    def evaluate(self, session, expression):
        result = self.call('Runtime.evaluate', {'expression': expression,
            'awaitPromise': True, 'returnByValue': True}, session)
        if result.get('exceptionDetails'):
            raise RuntimeError('Browser JS operation failed; details withheld.')
        return result.get('result', {}).get('value')

    def wait(self, session, expression, label):
        deadline = time.monotonic() + 25
        while time.monotonic() < deadline:
            try:
                if self.evaluate(session, expression):
                    print('PASS:', label, flush=True)
                    return
            except RuntimeError:
                pass  # Navigation may briefly replace the execution context.
            time.sleep(0.15)
        # Only record UI text, never input values, URLs or credential storage.
        text = self.evaluate(session, 'document.body.innerText.slice(0,1200)')
        print('UI at failure:', text, flush=True)
        raise AssertionError(label)

    def fill(self, session, selector, values):
        self.evaluate(session, '(() => {const nodes=[...document.querySelectorAll(' +
            json.dumps(selector) + ')]; const values=' + json.dumps(values) + ';'
            'if(nodes.length!==values.length)throw Error("field count");'
            'nodes.forEach((el,i)=>{Object.getOwnPropertyDescriptor('
            'el.tagName==="SELECT"?HTMLSelectElement.prototype:HTMLInputElement.prototype,'
            '"value").set.call(el,values[i]);'
            'el.dispatchEvent(new Event(el.tagName==="SELECT"?"change":"input",{bubbles:true}));});return true;})()')

    def click(self, session, text):
        self.evaluate(session, '(() => {const b=[...document.querySelectorAll("button,a")].find('
            'x=>x.textContent.trim()===' + json.dumps(text) + ');'
            'if(!b)throw Error("missing button");b.click();return true;})()')

    def screenshot(self, session, filename):
        try:
            self.call('Page.bringToFront', session=session)
            data = self.call('Page.captureScreenshot', {'format': 'png'}, session)['data']
            (ARTIFACTS / filename).write_bytes(base64.b64decode(data))
        except TimeoutError:
            print('ARTIFACT SKIP: Chrome screenshot timeout; functional checks continue.', flush=True)

    def close(self):
        try:
            self.call('Browser.close')
        except Exception:
            pass
        self.socket.close()
        try:
            self.process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            self.process.kill()
            self.process.wait(timeout=5)
        # Delete only this run's explicitly allocated temporary browser profile.
        if self.profile.is_relative_to(Path(tempfile.gettempdir()).resolve()) and self.profile.name.startswith('castra-membership-audit-'):
            shutil.rmtree(self.profile, ignore_errors=True)


def main():
    config = status()
    admin = {'apikey': config['SERVICE_ROLE_KEY'], 'Authorization': 'Bearer ' + config['SERVICE_ROLE_KEY']}
    public = {'apikey': config['ANON_KEY']}
    prefix = 'browser-recheck-' + uuid4().hex[:8]
    manager_email, employee_email = prefix + '-mm@example.test', prefix + '-employee@example.test'
    password = secrets.token_urlsafe(24)
    users = []
    workspace_id = str(uuid4())
    browser = None

    def auth(method, path, headers=None, **kwargs):
        response = httpx.request(method, API + '/auth/v1/' + path,
                                headers=headers or public, timeout=20, **kwargs)
        if response.is_error:
            raise RuntimeError('Local Auth operation failed: HTTP ' + str(response.status_code))
        return response.json() if response.content else None

    try:
        user = auth('POST', 'admin/users', admin, json={
            'email': manager_email, 'password': password, 'email_confirm': True})
        users.append(user['id'])
        auth('PUT', 'admin/users/' + user['id'], admin, json={'password': password})
        session = auth('POST', 'token?grant_type=password', json={'email': manager_email, 'password': password})
        sql(f"insert into public.workspaces(id,name,owner_id) values ('{workspace_id}','{prefix}','{user['id']}');"
            f"insert into public.workspace_members(workspace_id,user_id,role) values ('{workspace_id}','{user['id']}','admin');"
            f"insert into public.business_profiles(workspace_id,industry,company_size,target_customer) values ('{workspace_id}','Retail','sme','Local fixture');")
        bearer = {'Authorization': 'Bearer ' + session['access_token'], 'X-Workspace-ID': workspace_id}
        response = httpx.put(BACKEND + '/api/workspace/recruitment/', headers=bearer,
            json={'acceptingJoinRequests': True, 'publicDescription': 'Local browser acceptance'}, timeout=20)
        assert response.status_code == 200, 'Live backend recruitment configuration'
        print('PASS: actual backend 58000 uses disposable local fixtures', flush=True)

        browser = Browser()
        manager, employee = browser.page(), browser.page()
        for target in (manager, employee):
            browser.wait(target, '!!document.querySelector("input[type=email]")', 'login form rendered')
        browser.fill(manager, 'input[type=email],input[type=password]', [manager_email, password])
        browser.evaluate(manager, 'document.querySelector("form").requestSubmit()')
        browser.wait(manager, 'document.body.innerText.includes("Marketing Manager Dashboard")', 'real Manager form login')

        browser.click(employee, 'Đăng ký hoặc nhận liên kết xác thực')
        browser.wait(employee, 'document.querySelectorAll("input[type=password]").length===0', 'registration is email-only')
        browser.fill(employee, 'input[type=email]', [employee_email])
        browser.evaluate(employee, 'document.querySelector("form").requestSubmit()')
        deadline = time.monotonic() + 20
        link = None
        while time.monotonic() < deadline and not link:
            for item in httpx.get('http://127.0.0.1:57324/api/v1/messages').json()['messages']:
                if not any(x.get('Address', '').lower() == employee_email for x in item.get('To', [])):
                    continue
                mail = httpx.get('http://127.0.0.1:57324/api/v1/message/' + item['ID']).json()
                content = unescape(mail.get('HTML', '') + mail.get('Text', ''))
                link = next((x for x in re.findall(r'https?://[^\s<>"\']+', content) if '/auth/v1/verify?' in x), None)
            if not link:
                time.sleep(0.2)
        assert link, 'Verification email in local mailbox'
        print('PASS: real signup verification email received by local mailbox', flush=True)
        new_id = sql(f"select id from auth.users where email='{employee_email}';").strip()
        assert new_id
        users.append(new_id)
        browser.call('Page.navigate', {'url': API + '/auth/v1/verify?' + link.split('?', 1)[1]}, employee)
        browser.wait(employee, 'document.body.innerText.includes("Tạo mật khẩu của bạn")', 'email link opens password setup')
        browser.fill(employee, 'input[type=password]', [password, password])
        browser.evaluate(employee, 'document.querySelector("form").requestSubmit()')
        browser.wait(employee, 'document.body.innerText.includes("Công ty đang nhận yêu cầu")', 'password saved and company selector displayed')
        browser.fill(employee, 'select', [workspace_id])
        browser.evaluate(employee, 'document.querySelector("select").closest("form").requestSubmit()')
        browser.wait(employee, 'document.body.innerText.includes("Đã gửi yêu cầu.")', 'Employee submits join request through real UI')
        assert sql(f"select count(*) from public.workspace_members where user_id='{new_id}';").strip() == '0'
        print('PASS: no membership before manager approval', flush=True)
        browser.screenshot(employee, 'membership-browser-pending.png')

        browser.click(manager, 'Workspace Members')
        browser.wait(manager, 'document.body.innerText.includes("Thành viên & yêu cầu gia nhập")', 'real personnel page rendered')
        browser.click(manager, 'Chờ duyệt')
        browser.wait(manager, 'document.body.innerText.includes(' + json.dumps(employee_email) + ')', 'Manager sees correct applicant')
        notifications = httpx.get(BACKEND + '/api/membership-notifications/', headers=bearer).json()
        assert notifications['unreadCount'] == 1
        print('PASS: Manager notification is persisted in actual backend', flush=True)
        browser.click(manager, 'Duyệt')
        browser.wait(manager, '!!document.querySelector("[role=dialog]")', 'approval confirmation dialog')
        browser.evaluate(manager, 'document.querySelector("[role=dialog] form").requestSubmit()')
        browser.wait(manager, '!document.querySelector("[role=dialog]")', 'Manager approval accepted by server')
        assert sql(f"select role from public.workspace_members where user_id='{new_id}' and workspace_id='{workspace_id}';").strip() == 'member'
        browser.click(employee, 'Cập nhật trạng thái')
        browser.wait(employee, 'document.body.innerText.includes("My Dashboard")', 'approved applicant enters Employee dashboard')
        browser.call('Page.reload', {}, employee)
        browser.wait(employee, 'document.body.innerText.includes("My Dashboard")', 'Employee session and membership survive reload')
        browser.screenshot(employee, 'membership-browser-approved.png')
        print('PASS: browser end-to-end local flow complete; no preview adapter used', flush=True)

        browser.click(manager, 'Tạo nhóm')
        browser.wait(manager, '!!document.querySelector("[role=dialog] input")', 'create-Team dialog rendered')
        browser.fill(manager, '[role=dialog] input', ['Browser QA Team'])
        browser.evaluate(manager, 'document.querySelector("[role=dialog] form").requestSubmit()')
        browser.wait(manager, '!document.querySelector("[role=dialog]")', 'Team creation persisted')
        team_id = sql(f"select id from public.workspace_teams where workspace_id='{workspace_id}' and name='Browser QA Team';").strip()
        assert team_id
        browser.click(manager, 'Thành viên')
        browser.wait(manager, 'document.body.innerText.includes(' + json.dumps(employee_email) + ')', 'approved applicant appears in real member directory')
        browser.evaluate(manager, '(() => {const row=[...document.querySelectorAll("tr")].find(x=>x.innerText.includes(' +
            json.dumps(employee_email) + ')); const button=[...row.querySelectorAll("button")].find(x=>x.textContent.trim()==="Phân công"); button.click(); return true;})()')
        browser.wait(manager, 'document.querySelectorAll("[role=dialog] select").length===2', 'assignment dialog rendered')
        browser.fill(manager, '[role=dialog] select', ['manager', team_id])
        browser.evaluate(manager, 'document.querySelector("[role=dialog] form").requestSubmit()')
        browser.wait(manager, '!document.querySelector("[role=dialog]")', 'role and Team assignment accepted')
        assert sql(f"select role from public.workspace_members where workspace_id='{workspace_id}' and user_id='{new_id}';").strip() == 'manager'
        assert sql(f"select count(*) from public.workspace_team_members where workspace_id='{workspace_id}' and user_id='{new_id}' and team_id='{team_id}';").strip() == '1'
        print('PASS: actual database contains Leader role and selected Team', flush=True)
        browser.call('Page.reload', {}, employee)
        browser.wait(employee, 'document.body.innerText.includes("Leader Workspace")', 'new Leader authority takes effect after session restoration')

        invited_email = prefix + '-invited@example.test'
        browser.click(manager, 'Mời nhân sự')
        browser.wait(manager, '!!document.querySelector("[role=dialog] input[type=email]")', 'real invitation dialog rendered')
        browser.fill(manager, '[role=dialog] input[type=email]', [invited_email])
        browser.evaluate(manager, 'document.querySelector("[role=dialog] form").requestSubmit()')
        browser.wait(manager, '!document.querySelector("[role=dialog]")', 'invitation submitted through actual UI')
        invited_id = sql(f"select id from auth.users where email='{invited_email}';").strip()
        assert invited_id
        users.append(invited_id)
        browser.click(manager, 'Lời mời')
        browser.wait(manager, 'document.body.innerText.includes(' + json.dumps(invited_email) + ')', 'persisted invitation visible in invitation tab')
        assert sql(f"select delivery_status from public.workspace_invitations where workspace_id='{workspace_id}' and normalized_email='{invited_email}';").strip() == 'sent'
        assert sql(f"select count(*) from public.workspace_members where user_id='{invited_id}';").strip() == '0'
        print('PASS: real invitation email accepted locally; no membership before acceptance', flush=True)
        browser.screenshot(manager, 'membership-browser-invitation.png')
    finally:
        if browser:
            browser.close()
        sql(f"delete from public.workspaces where id='{workspace_id}';")
        # Also find the exact email if signup succeeded before its UUID was captured.
        leftover = sql(f"select id from auth.users where email='{employee_email}';").strip()
        if leftover and leftover not in users:
            users.append(leftover)
        invite_leftover = sql(f"select id from auth.users where email='{prefix}-invited@example.test';").strip()
        if invite_leftover and invite_leftover not in users:
            users.append(invite_leftover)
        for uid in users:
            auth('DELETE', 'admin/users/' + uid, admin)
        print('Local browser fixtures removed; hosted and original user tabs untouched.', flush=True)


if __name__ == '__main__':
    main()
