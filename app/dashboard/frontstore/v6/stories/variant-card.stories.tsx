import React from "react";
import VariantCard from "../components/variant-card";

export default {
  title: "FrontstoreV6/VariantCard",
  component: VariantCard,
};

export const ImageVariant = () => (
  <VariantCard id="v-demo-1" title="Editorial" type="image" onView={() => {}} />
);
export const VideoVariant = () => (
  <VariantCard id="v-demo-2" title="Cinematic" type="video" onView={() => {}} />
);
