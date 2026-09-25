import os
import sys
import subprocess
import time

CURRENT = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(CURRENT,"..")


def generate_services_command(command:list,directory:str):
    try:
        result = subprocess.run(
            command,
            cwd=directory,
            check=False,
            capture_output=False,
            text=False
        )
        time.sleep(1)
        if result.returncode == 0:
            print("[+]: Phase completed")
        else:
            print("[x]: Phase failed")
        
    except Exception as error:
        print("[x]: Cannot generate project subject automatically.")
        print("[!]: ",error)


def commands_sprint(prj_name:str,prj_services:str,prj_templates:str):
    try:
        prj_name_directory = os.path.join(CURRENT,prj_name)
        prj_templates = os.path.join(prj_name_directory,prj_templates)

        generate_services_command(["django-admin","startproject",prj_name],CURRENT)
        generate_services_command(["python","manage.py","startapp",prj_services],prj_name_directory)
        os.makedirs(prj_templates,exist_ok=True)
        
        print(f"[+]: Templates is setup completed.")
        time.sleep(1)
        print("[~]: ALL PHASE COMPLETED.")

    except Exception as error:
        print("[x]: Errors occured during generate script")
        print("[!]: ",error)
    

if __name__ == "__main__":
    commands_sprint("TEST","TEST_SERVICES","TEST_TEMPALTES")
