import archiver from "archiver";
import { PassThrough } from "stream";

export async function GET() {
  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Services" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const workbookRels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>`;

  const sheet = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="inlineStr"><is><t>name*</t></is></c>
      <c r="B1" t="inlineStr"><is><t>price*</t></is></c>
      <c r="C1" t="inlineStr"><is><t>duration</t></is></c>
      <c r="D1" t="inlineStr"><is><t>category</t></is></c>
      <c r="E1" t="inlineStr"><is><t>description</t></is></c>
      <c r="F1" t="inlineStr"><is><t>isPublished</t></is></c>
      <c r="G1" t="inlineStr"><is><t>isFeatured</t></is></c>
      <c r="H1" t="inlineStr"><is><t>city</t></is></c>
      <c r="I1" t="inlineStr"><is><t>country</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>Consultation</t></is></c>
      <c r="B2" t="inlineStr"><is><t>120.00</t></is></c>
      <c r="C2" t="inlineStr"><is><t>1 hour</t></is></c>
      <c r="D2" t="inlineStr"><is><t>Consulting</t></is></c>
      <c r="E2" t="inlineStr"><is><t>One-hour consultation</t></is></c>
      <c r="F2" t="inlineStr"><is><t>true</t></is></c>
      <c r="G2" t="inlineStr"><is><t>false</t></is></c>
      <c r="H2" t="inlineStr"><is><t>San Francisco</t></is></c>
      <c r="I2" t="inlineStr"><is><t>United States</t></is></c>
    </row>
  </sheetData>
</worksheet>`;

  const archive = archiver("zip", { zlib: { level: 9 } });
  const pass = new PassThrough();
  archive.pipe(pass);

  archive.append(contentTypes, { name: "[Content_Types].xml" });
  archive.append(rels, { name: "_rels/.rels" });
  archive.append(workbook, { name: "xl/workbook.xml" });
  archive.append(workbookRels, { name: "xl/_rels/workbook.xml.rels" });
  archive.append(sheet, { name: "xl/worksheets/sheet1.xml" });

  await archive.finalize();

  const chunks: Uint8Array[] = [];
  for await (const chunk of pass) {
    chunks.push(Buffer.from(chunk));
  }

  const buffer = Buffer.concat(chunks);

  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=services-sample.xlsx",
    },
  });
}
