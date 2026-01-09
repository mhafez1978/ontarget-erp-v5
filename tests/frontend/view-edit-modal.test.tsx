import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "chai";
import sinon from "sinon";
import ViewEditModal from "@/app/dashboard/frontstore/v6/components/view-edit-modal";
import { toast } from "sonner";

describe("ViewEditModal actions", () => {
  let fetchStub: sinon.SinonStub;
  let toastSuccessStub: sinon.SinonStub;
  let toastErrorStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(global, "fetch");
    toastSuccessStub = sinon.stub(toast, "success");
    toastErrorStub = sinon.stub(toast, "error");
  });

  afterEach(() => {
    fetchStub.restore();
    toastSuccessStub.restore();
    toastErrorStub.restore();
  });

  it("saves prompt via PATCH and shows success toast", async () => {
    fetchStub
      .withArgs(
        sinon.match("/api/frontstore/v6/sections/sec-1/variants/var-1"),
        sinon.match.has("method", "PATCH")
      )
      .resolves(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const variant = {
      id: "var-1",
      title: "Test Variant",
      type: "video",
      assets: [],
      meta: { prompt: "" },
      __sectionId: "sec-1",
    } as any;

    render(
      <ViewEditModal
        open={true}
        onOpenChange={() => {}}
        variant={variant}
        onSave={() => {}}
      />
    );

    const ta = screen.getByPlaceholderText("Generation prompt (optional)");
    await userEvent.clear(ta);
    await userEvent.type(ta, "New prompt text");

    const saveBtn = screen.getByText("Save Prompt");
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(
        fetchStub.calledWithMatch(
          "/api/frontstore/v6/sections/sec-1/variants/var-1"
        )
      ).to.equal(true);
      expect(toastSuccessStub.calledWith("Prompt saved")).to.equal(true);
    });
  });

  it("shows error toast when prompt save fails", async () => {
    fetchStub
      .withArgs(
        sinon.match("/api/frontstore/v6/sections/sec-1/variants/var-1"),
        sinon.match.any
      )
      .resolves(new Response("", { status: 500 }));

    const variant = {
      id: "var-1",
      title: "Test Variant",
      type: "video",
      assets: [],
      meta: { prompt: "" },
      __sectionId: "sec-1",
    } as any;

    render(
      <ViewEditModal
        open={true}
        onOpenChange={() => {}}
        variant={variant}
        onSave={() => {}}
      />
    );

    const ta = screen.getByPlaceholderText("Generation prompt (optional)");
    await userEvent.clear(ta);
    await userEvent.type(ta, "Broken prompt");

    const saveBtn = screen.getByText("Save Prompt");
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(toastErrorStub.calledWith("Failed to save prompt")).to.equal(true);
    });
  });

  it("enqueues generate-video and shows success toast", async () => {
    fetchStub
      .withArgs(
        sinon.match("/api/frontstore/v6/generate-video"),
        sinon.match.has("method", "POST")
      )
      .resolves(
        new Response(JSON.stringify({ jobId: "job-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const variant = {
      id: "var-2",
      title: "Test Variant",
      type: "video",
      assets: [],
      meta: { prompt: "existing" },
      __sectionId: "sec-1",
    } as any;

    render(
      <ViewEditModal
        open={true}
        onOpenChange={() => {}}
        variant={variant}
        onSave={() => {}}
      />
    );

    const genBtn = screen.getByText("Generate Video");
    await userEvent.click(genBtn);

    await waitFor(() => {
      expect(
        fetchStub.calledWithMatch("/api/frontstore/v6/generate-video")
      ).to.equal(true);
      expect(toastSuccessStub.calledWith("Video job enqueued")).to.equal(true);
    });
  });

  it("shows error toast when generate-video fails", async () => {
    fetchStub
      .withArgs(
        sinon.match("/api/frontstore/v6/generate-video"),
        sinon.match.any
      )
      .resolves(new Response("", { status: 500 }));

    const variant = {
      id: "var-2",
      title: "Test Variant",
      type: "video",
      assets: [],
      meta: { prompt: "existing" },
      __sectionId: "sec-1",
    } as any;

    render(
      <ViewEditModal
        open={true}
        onOpenChange={() => {}}
        variant={variant}
        onSave={() => {}}
      />
    );

    const genBtn = screen.getByText("Generate Video");
    await userEvent.click(genBtn);

    await waitFor(() => {
      expect(toastErrorStub.calledWith("Failed to enqueue video")).to.equal(
        true
      );
    });
  });
});
