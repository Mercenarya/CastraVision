"""Bounded, deterministic report artifacts; no provider calls or secret fields."""

import csv
import io
from functools import lru_cache
from pathlib import Path
from xml.sax.saxutils import escape

METRICS = {
    "spend": "Chi tiêu",
    "revenue": "Doanh thu",
    "conversions": "Chuyển đổi",
    "clicks": "Lượt nhấp",
    "impressions": "Lượt hiển thị",
    "roas": "ROAS",
    "cpa": "CPA",
    "ctr": "CTR (%)",
}


def safe_cell(value):
    text = "—" if value is None else str(value)
    return "'" + text if text.lstrip().startswith(("=", "+", "-", "@")) else text


@lru_cache(maxsize=1)
def register_font():
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    path = Path(__file__).parent / "assets" / "fonts" / "NotoSans-Regular.ttf"
    pdfmetrics.registerFont(TTFont("CastraNoto", str(path)))


def render_report(snapshot, file_format):
    metrics = snapshot["metrics"]
    headers = ["Chiến dịch", "Kênh", *[METRICS[key] for key in metrics]]
    rows = [
        [row["campaign"], row["channel"], *[row.get(key) for key in metrics]]
        for row in snapshot["rows"]
    ]
    if file_format == "csv":
        stream = io.StringIO(newline="")
        writer = csv.writer(stream)
        writer.writerow(
            [
                "Từ ngày UTC",
                snapshot["from"],
                "Đến ngày UTC",
                snapshot["to"],
                "Tiền tệ",
                snapshot["currency"],
            ]
        )
        writer.writerow(headers)
        writer.writerows([[safe_cell(value) for value in row] for row in rows])
        return stream.getvalue().encode("utf-8-sig")
    if file_format != "pdf":
        raise ValueError("Unsupported report format")

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    register_font()
    stream = io.BytesIO()
    style = ParagraphStyle("report", fontName="CastraNoto", fontSize=8, leading=12)

    def paragraph(value):
        return Paragraph(escape("—" if value is None else str(value)), style)

    content = [
        paragraph("CastraVision — Báo cáo hiệu suất"),
        paragraph(f"{snapshot['from']} → {snapshot['to']} (UTC) · {snapshot['currency']}"),
        Spacer(1, 12),
    ]
    width = 770 / len(headers)
    table = Table(
        [[paragraph(value) for value in row] for row in [headers, *rows]],
        colWidths=[width] * len(headers),
        repeatRows=1,
    )
    table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.3, colors.grey),
                ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    content.extend(
        [
            table,
            Spacer(1, 12),
            paragraph(
                "Chỉ tổng hợp dữ liệu quan sát đã nhập; không suy diễn số liệu thiếu. "
                "—: không có mẫu số hợp lệ."
            ),
        ]
    )
    SimpleDocTemplate(
        stream, pagesize=landscape(A4), leftMargin=35, rightMargin=35, topMargin=35, bottomMargin=35
    ).build(content)
    return stream.getvalue()
