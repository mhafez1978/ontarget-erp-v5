import archiver from "archiver";
import { PassThrough } from "stream";

export async function GET() {
  // Minimal OOXML parts for a single-sheet workbook with inline string cells
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
    <sheet name="Customers" sheetId="1" r:id="rId1"/>
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
      <c r="A1" t="inlineStr"><is><t>email*</t></is></c>
      <c r="B1" t="inlineStr"><is><t>name*</t></is></c>
      <c r="C1" t="inlineStr"><is><t>password</t></is></c>
      <c r="D1" t="inlineStr"><is><t>phone</t></is></c>
      <c r="E1" t="inlineStr"><is><t>addressLine1</t></is></c>
      <c r="F1" t="inlineStr"><is><t>addressLine2</t></is></c>
      <c r="G1" t="inlineStr"><is><t>city</t></is></c>
      <c r="H1" t="inlineStr"><is><t>state</t></is></c>
      <c r="I1" t="inlineStr"><is><t>country</t></is></c>
      <c r="J1" t="inlineStr"><is><t>countryCode</t></is></c>
      <c r="K1" t="inlineStr"><is><t>postalCode</t></is></c>
      <c r="L1" t="inlineStr"><is><t>latitude</t></is></c>
      <c r="M1" t="inlineStr"><is><t>longitude</t></is></c>
      <c r="N1" t="inlineStr"><is><t>image</t></is></c>
    </row>
    <row r="2">
      <c r="A2" t="inlineStr"><is><t>jane.doe@example.com</t></is></c>
      <c r="B2" t="inlineStr"><is><t>Jane Doe</t></is></c>
      <c r="C2" t="inlineStr"><is><t>TempPass123!</t></is></c>
      <c r="D2" t="inlineStr"><is><t>555-0101</t></is></c>
      <c r="E2" t="inlineStr"><is><t>123 Main St</t></is></c>
      <c r="F2" t="inlineStr"><is><t></t></is></c>
      <c r="G2" t="inlineStr"><is><t>New York</t></is></c>
      <c r="H2" t="inlineStr"><is><t>NY</t></is></c>
      <c r="I2" t="inlineStr"><is><t>United States</t></is></c>
      <c r="J2" t="inlineStr"><is><t>US</t></is></c>
      <c r="K2" t="inlineStr"><is><t>10001</t></is></c>
      <c r="L2" t="inlineStr"><is><t>40.7128</t></is></c>
      <c r="M2" t="inlineStr"><is><t>-74.0060</t></is></c>
      <c r="N2" t="inlineStr"><is><t>http://example.com/avatar/jane.png</t></is></c>
    </row>
    <row r="3">
      <c r="A3" t="inlineStr"><is><t>john.smith@example.com</t></is></c>
      <c r="B3" t="inlineStr"><is><t>John Smith</t></is></c>
      <c r="C3" t="inlineStr"><is><t>Welcome456!</t></is></c>
      <c r="D3" t="inlineStr"><is><t>555-0202</t></is></c>
      <c r="E3" t="inlineStr"><is><t>55 Oak Ave</t></is></c>
      <c r="F3" t="inlineStr"><is><t>Apt 3</t></is></c>
      <c r="G3" t="inlineStr"><is><t>Boston</t></is></c>
      <c r="H3" t="inlineStr"><is><t>MA</t></is></c>
      <c r="I3" t="inlineStr"><is><t>United States</t></is></c>
      <c r="J3" t="inlineStr"><is><t>US</t></is></c>
      <c r="K3" t="inlineStr"><is><t>02101</t></is></c>
      <c r="L3" t="inlineStr"><is><t>42.3601</t></is></c>
      <c r="M3" t="inlineStr"><is><t>-71.0589</t></is></c>
      <c r="N3" t="inlineStr"><is><t>http://example.com/avatar/john.png</t></is></c>
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
      "Content-Disposition": "attachment; filename=customers-sample.xlsx",
    },
  });
}
