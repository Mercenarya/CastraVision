import base64
import unittest

from .manager_reporting import register_font, render_report


class ManagerReportRenderingTests(unittest.TestCase):
    def test_embedded_font_covers_vietnamese(self):
        from reportlab.pdfbase import pdfmetrics

        register_font()
        font = pdfmetrics.getFont("CastraNoto")
        for letter in "Báo cáo hiệu suất Chiến dịch mùa hè Đối thủ Nguyễn":
            self.assertIn(ord(letter), font.face.charToGlyph)

    def test_csv_escapes_formula_and_quotes_and_preserves_vietnamese(self):
        snapshot = {
            "from": "2026-11-01",
            "to": "2026-11-19",
            "currency": "VND",
            "metrics": ["spend", "roas"],
            "rows": [
                {"campaign": "=SUM(1,2)", "channel": 'Nội dung "mới"', "spend": 100, "roas": None}
            ],
        }
        result = render_report(snapshot, "csv").decode("utf-8-sig")
        self.assertIn("'=SUM(1,2)", result)
        self.assertIn('Nội dung ""mới""', result)
        self.assertIn("—", result)

    def test_pdf_is_real_unicode_pdf(self):
        snapshot = {
            "from": "2026-11-01",
            "to": "2026-11-19",
            "currency": "VND",
            "metrics": ["spend"],
            "rows": [{"campaign": "Chiến dịch mùa hè", "channel": "Meta", "spend": 100}],
        }
        result = render_report(snapshot, "pdf")
        self.assertTrue(result.startswith(b"%PDF-"))
        self.assertIn(b"%%EOF", result[-30:])
        self.assertIn(b"/FontFile2", result)
        self.assertGreater(len(base64.b64encode(result)), 1000)
