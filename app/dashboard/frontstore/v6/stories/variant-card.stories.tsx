import React from "react";
import VariantCard from "../components/variant-card";

export default {
  title: "FrontstoreV6/VariantCard",
  component: VariantCard,
};

export const ImageVariant = () => (
  <VariantCard title="Editorial" type="image" onView={() => {}} />
);
export const VideoVariant = () => (
  <VariantCard title="Cinematic" type="video" onView={() => {}} />
);
