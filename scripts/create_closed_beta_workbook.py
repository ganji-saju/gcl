from __future__ import annotations

import html
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUTPUTS = [
    ROOT / "docs" / "operations" / "closed-beta-master-sheet.xlsx",
    ROOT / "client" / "public" / "beta" / "closed-beta-master-sheet.xlsx",
]


SHEETS: list[tuple[str, list[list[object]]]] = [
    (
        "00_Dashboard",
        [
            ["Metric", "Target", "Current", "Formula / Source", "Owner"],
            ["Total leads", 300, '=COUNTA(\'01_Leads\'!A2:A501)', "01_Leads", "Growth"],
            ["Qualified cases", 150, '=COUNTIF(\'02_Cases\'!D2:D501,\"qualified\")+COUNTIF(\'02_Cases\'!D2:D501,\"quote_requested\")+COUNTIF(\'02_Cases\'!D2:D501,\"quote_sent\")+COUNTIF(\'02_Cases\'!D2:D501,\"deposit_paid\")+COUNTIF(\'02_Cases\'!D2:D501,\"booking_confirmed\")', "02_Cases", "Ops"],
            ["Quote requests", 80, '=COUNTIF(\'02_Cases\'!D2:D501,\"quote_requested\")+COUNTIF(\'02_Cases\'!D2:D501,\"quote_sent\")+COUNTIF(\'02_Cases\'!D2:D501,\"deposit_paid\")+COUNTIF(\'02_Cases\'!D2:D501,\"booking_confirmed\")', "02_Cases", "Coordinator"],
            ["Quotes sent", 45, '=COUNTIF(\'05_Quotes\'!M2:M501,\"sent\")+COUNTIF(\'05_Quotes\'!M2:M501,\"accepted\")', "05_Quotes", "Provider Ops"],
            ["Deposit paid", 15, '=COUNTIF(\'06_Deposits_Bookings\'!G2:G501,\"paid\")', "06_Deposits_Bookings", "Ops"],
            ["Booking confirmed", 15, '=COUNTIF(\'06_Deposits_Bookings\'!L2:L501,\"confirmed\")', "06_Deposits_Bookings", "Ops"],
            ["Unreconciled ledger rows", 0, '=COUNTIF(\'07_Settlement_Ledger\'!K2:K501,\"unreconciled\")', "07_Settlement_Ledger", "Finance"],
            ["Compliance incidents", 0, '=COUNTIF(\'10_Risk_Log\'!E2:E501,\"open\")', "10_Risk_Log", "Compliance"],
            ["Decision rule", "Scale only winning cells", "Provider + channel must be positive contribution and compliant", "Weekly review", "Growth"],
        ],
    ),
    (
        "01_Leads",
        [
            ["lead_id", "created_at", "locale", "market", "source", "campaign", "landing_path", "package_id", "name", "contact", "nationality", "residence_country", "preferred_language", "eligibility_status", "consent_medical_info", "consent_marketing"],
            ["lead-0001", "2026-06-10", "jp", "japan", "paid_search", "jp_laser_toning_test", "/jp/korea-laser-toning-package", "jp-skin-01", "Beta Lead A", "line:sample-a", "Japan", "Japan", "ja", "eligible", True, True],
            ["lead-0002", "2026-06-10", "en", "taiwan", "seo", "tw_skin_booster", "/en/korea-skin-booster-package", "tw-skin-01", "Beta Lead B", "email:sample-b@example.com", "Taiwan", "Taiwan", "en", "eligible", True, False],
            ["lead-0003", "2026-06-10", "jp", "japan", "referral", "jp_weekend_skin", "/jp/seoul-anti-aging-skin-package", "jp-skin-02", "Beta Lead C", "whatsapp:sample-c", "Japan", "Japan", "ja", "eligible", True, True],
        ],
    ),
    (
        "02_Cases",
        [
            ["case_id", "lead_id", "owner", "status", "priority", "language", "procedure", "budget_band", "travel_start", "travel_end", "first_response_at", "last_contacted_at", "next_action_at", "matched_provider", "sla_status", "risk_flags"],
            ["case-0001", "lead-0001", "Mina", "quote_sent", "high", "ja", "laser-toning", "$700-$1200", "2026-07-10", "2026-07-12", "2026-06-10 09:06", "2026-06-10 11:20", "2026-06-11 09:00", "Lumen Skin Center", "on_track", ""],
            ["case-0002", "lead-0002", "Jin", "matching_ready", "normal", "en", "skin-booster", "$900-$1800", "2026-07-18", "2026-07-21", "2026-06-10 10:02", "2026-06-10 10:40", "2026-06-10 14:00", "TBD", "on_track", ""],
            ["case-0003", "lead-0003", "Mina", "deposit_paid", "high", "ja", "skin-booster", "$1200-$2200", "2026-07-05", "2026-07-08", "2026-06-10 10:35", "2026-06-10 13:15", "2026-07-03 09:00", "Prime Skin Gangnam", "on_track", ""],
        ],
    ),
    (
        "03_Provider_SLA",
        [
            ["provider_id", "provider_name", "region", "specialty", "registration_verified", "insurance_verified", "languages", "SLA_hours", "urgent_SLA_hours", "quote_template_ready", "deposit_policy_ready", "sla_status", "active", "beta_score", "owner", "next_step"],
            ["prov-001", "Lumen Skin Center", "Gangnam", "Dermatology", True, True, "ja,en,ko,zh", 6, 4, True, True, "draft", True, 92, "Biz", "Send SLA addendum"],
            ["prov-002", "Prime Skin Gangnam", "Gangnam", "Dermatology", True, True, "ja,en,ko", 8, 4, True, False, "negotiating", True, 86, "Biz", "Confirm deposit policy"],
            ["prov-003", "Seoul Glow Dermatology", "Gangnam", "Dermatology", True, True, "en,zh,ko", 12, 4, True, True, "sent", True, 84, "Biz", "Collect signed copy"],
            ["prov-004", "Apgujeong Laser Clinic", "Gangnam", "Dermatology", True, False, "ja,en,ko", 12, 6, True, False, "draft", False, 72, "Ops", "Verify insurance"],
            ["prov-005", "Atelier Recovery Clinic", "Hongdae", "Recovery", True, True, "ja,en,zh,vi", 8, 4, True, True, "sent", True, 88, "Ops", "Confirm non-medical margin"],
        ],
    ),
    (
        "04_Matching",
        [
            ["case_id", "provider_id", "rank", "clinical_fit", "availability", "language_fit", "price_fit", "SLA_score", "total_score", "exclusion_reason"],
            ["case-0001", "prov-001", 1, 94, 86, 96, 88, 90, 91.2, ""],
            ["case-0001", "prov-004", 2, 88, 90, 94, 84, 72, 85.6, "insurance pending"],
            ["case-0002", "prov-003", 1, 90, 80, 85, 82, 84, 84.8, ""],
            ["case-0003", "prov-002", 1, 92, 88, 96, 86, 86, 89.0, ""],
        ],
    ),
    (
        "05_Quotes",
        [
            ["quote_id", "case_id", "provider_id", "medical_fee", "nonmedical_fee", "currency", "commission_rate", "cap_rate", "commission_amount", "deposit_amount", "valid_until", "sent_at", "status", "notes"],
            ["quote-0001", "case-0001", "prov-001", 980, 80, "USD", 0.15, 0.30, "=D2*G2", 150, "2026-06-20", "2026-06-10 11:00", "sent", "Final plan may change after provider consultation."],
            ["quote-0002", "case-0003", "prov-002", 1600, 120, "USD", 0.16, 0.30, "=D3*G3", 300, "2026-06-22", "2026-06-10 12:50", "accepted", "Deposit paid; visit confirmation pending."],
        ],
    ),
    (
        "06_Deposits_Bookings",
        [
            ["payment_id", "booking_id", "case_id", "quote_id", "payment_type", "deposit_amount", "deposit_status", "paid_at", "transaction_ref", "scheduled_at", "visit_type", "booking_status", "refund_status"],
            ["pay-0001", "book-0001", "case-0003", "quote-0002", "deposit", 300, "paid", "2026-06-10 13:10", "manual-beta-0001", "2026-07-06 10:30", "procedure", "confirmed", "none"],
        ],
    ),
    (
        "07_Settlement_Ledger",
        [
            ["ledger_id", "provider_id", "case_id", "quote_id", "gross_medical_fee", "commission_rate", "commission_amount", "partner_payout", "payment_fee", "refund_or_dispute_cost", "settlement_status", "platform_net"],
            ["ledger-0001", "prov-002", "case-0003", "quote-0002", 1600, 0.16, "=E2*F2", 0, 9, 0, "reconciled", "=G2-H2-I2-J2"],
        ],
    ),
    (
        "08_Provider_Ranking",
        [
            ["provider_id", "provider_name", "leads_matched", "quotes_sent", "quote_rate", "deposit_count", "deposit_rate", "SLA_breach_rate", "complaint_count", "rank_score", "tier"],
            ["prov-001", "Lumen Skin Center", 1, 1, "=D2/C2", 0, "=F2/C2", 0, 0, 82, "B"],
            ["prov-002", "Prime Skin Gangnam", 1, 1, "=D3/C3", 1, "=F3/C3", 0, 0, 94, "A"],
            ["prov-003", "Seoul Glow Dermatology", 1, 0, "=D4/C4", 0, "=F4/C4", 0, 0, 70, "B"],
            ["prov-004", "Apgujeong Laser Clinic", 1, 0, "=D5/C5", 0, "=F5/C5", 1, 0, 48, "C"],
            ["prov-005", "Atelier Recovery Clinic", 0, 0, "", 0, "", 0, 0, 76, "B"],
        ],
    ),
    (
        "09_Channel_Ranking",
        [
            ["source", "campaign", "leads", "qualified_rate", "quote_rate", "deposit_rate", "CAC", "platform_revenue", "contribution_profit", "budget_action"],
            ["paid_search", "jp_laser_toning_test", 1, 1, 1, 0, 45, 147, 82, "continue test"],
            ["seo", "tw_skin_booster", 1, 1, 0, 0, 0, 0, 0, "observe"],
            ["referral", "jp_weekend_skin", 1, 1, 1, 1, 20, 247, 198, "increase"],
        ],
    ),
    (
        "10_Risk_Log",
        [
            ["issue_id", "created_at", "case_id", "provider_id", "risk_type", "severity", "owner", "status", "resolution", "audit_note"],
            ["risk-0001", "2026-06-10", "case-0001", "prov-004", "insurance_pending", "medium", "Ops", "watch", "Provider excluded until insurance is verified.", "Do not assign paid cases."],
        ],
    ),
]


def col_name(index: int) -> str:
    name = ""
    while index:
        index, remainder = divmod(index - 1, 26)
        name = chr(65 + remainder) + name
    return name


def cell_xml(row_index: int, col_index: int, value: object) -> str:
    ref = f"{col_name(col_index)}{row_index}"
    if value is None or value == "":
        return f'<c r="{ref}"/>'
    if isinstance(value, bool):
        return f'<c r="{ref}" t="b"><v>{1 if value else 0}</v></c>'
    if isinstance(value, (int, float)):
        return f'<c r="{ref}"><v>{value}</v></c>'
    text = str(value)
    if text.startswith("="):
        return f'<c r="{ref}"><f>{html.escape(text[1:])}</f></c>'
    return f'<c r="{ref}" t="inlineStr"><is><t>{html.escape(text)}</t></is></c>'


def worksheet_xml(rows: list[list[object]]) -> str:
    row_xml = []
    for row_index, row in enumerate(rows, start=1):
        cells = "".join(cell_xml(row_index, col_index, value) for col_index, value in enumerate(row, start=1))
        row_xml.append(f'<row r="{row_index}">{cells}</row>')
    max_col = max(len(row) for row in rows)
    dimension = f"A1:{col_name(max_col)}{len(rows)}"
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <dimension ref="{dimension}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetData>{''.join(row_xml)}</sheetData>
</worksheet>'''


def workbook_xml() -> str:
    sheets = []
    for index, (name, _) in enumerate(SHEETS, start=1):
        sheets.append(f'<sheet name="{html.escape(name)}" sheetId="{index}" r:id="rId{index}"/>')
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>{''.join(sheets)}</sheets>
  <calcPr calcMode="auto"/>
</workbook>'''


def workbook_rels_xml() -> str:
    rels = []
    for index in range(1, len(SHEETS) + 1):
        rels.append(
            f'<Relationship Id="rId{index}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{index}.xml"/>'
        )
    rels.append(
        f'<Relationship Id="rId{len(SHEETS) + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
    )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{''.join(rels)}</Relationships>'''


def content_types_xml() -> str:
    overrides = [
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>',
    ]
    for index in range(1, len(SHEETS) + 1):
        overrides.append(
            f'<Override PartName="/xl/worksheets/sheet{index}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        )
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  {''.join(overrides)}
</Types>'''


def root_rels_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''


def styles_xml() -> str:
    return '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><color theme="1"/><name val="Calibri"/><family val="2"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>'''


def write_workbook(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types_xml())
        archive.writestr("_rels/.rels", root_rels_xml())
        archive.writestr("xl/workbook.xml", workbook_xml())
        archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels_xml())
        archive.writestr("xl/styles.xml", styles_xml())
        for index, (_, rows) in enumerate(SHEETS, start=1):
            archive.writestr(f"xl/worksheets/sheet{index}.xml", worksheet_xml(rows))


def main() -> None:
    for output in OUTPUTS:
        write_workbook(output)
        print(output)


if __name__ == "__main__":
    main()
