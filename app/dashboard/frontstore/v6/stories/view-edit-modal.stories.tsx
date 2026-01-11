import React from "react";
import ViewEditModal from "../components/view-edit-modal";

export default {
  title: "FrontstoreV6/ViewEditModal",
  component: ViewEditModal,
};

export const Open = () => (
  <div>
    <ViewEditModal
      open={true}
      onOpenChange={() => {}}
      variant={{
        id: "v1",
        title: "Cinematic",
        type: "video",
        assets: [
          {
            type: "image",
            url: "https://source.unsplash.com/featured/800x450?sig=1",
          },
        ],
      }}
      onSave={(p) => console.log("Saved", p)}
    />
  </div>
);
