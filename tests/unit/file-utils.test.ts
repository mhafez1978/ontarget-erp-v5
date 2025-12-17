import { expect } from "chai";
import { getMimeTypeFromExtension, getFileIcon } from "@/lib/file-utils";

describe("getMimeTypeFromExtension", () => {
  it("should map common extensions to mime types", () => {
    expect(getMimeTypeFromExtension("document.pdf")).to.equal(
      "application/pdf"
    );
    expect(getMimeTypeFromExtension("photo.jpg")).to.equal("image/jpeg");
    expect(getMimeTypeFromExtension("spreadsheet.xlsx")).to.equal(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(getMimeTypeFromExtension("archive.zip")).to.equal("application/zip");
    expect(getMimeTypeFromExtension("unknown.foobar")).to.equal(
      "application/octet-stream"
    );

    // CAD and business formats
    expect(["application/acad", "image/vnd.dwg"]).to.include(
      getMimeTypeFromExtension("drawing.dwg")
    );
    expect(getMimeTypeFromExtension("model.stl")).to.equal("model/stl");
    expect(["application/step", "model/step"]).to.include(
      getMimeTypeFromExtension("assembly.step")
    );
    expect(getMimeTypeFromExtension("plan.cad")).to.equal("application/cad");
    expect([
      "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
      "application/vnd.ms-excel.sheet.binary.macroenabled.12",
    ]).to.include(getMimeTypeFromExtension("spreadsheet.xlsb"));
    expect(getMimeTypeFromExtension("visio.vsdx")).to.equal(
      "application/vnd.visio"
    );
  });

  describe("getFileIcon", () => {
    it("should return icon components for common mime types", () => {
      const checkIcon = (v: unknown) =>
        typeof v === "function" || typeof v === "object";
      expect(getFileIcon("application/pdf")).to.satisfy(checkIcon);
      expect(getFileIcon("image/png")).to.satisfy(checkIcon);
      expect(getFileIcon("video/mp4")).to.satisfy(checkIcon);
      expect(getFileIcon("audio/mpeg")).to.satisfy(checkIcon);
      expect(getFileIcon("application/zip")).to.satisfy(checkIcon);
      expect(getFileIcon("application/javascript")).to.satisfy(checkIcon);
    });
  });
});
