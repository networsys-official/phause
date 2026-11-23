import { PageMenuFields } from "@/components/cms/PageMenuFields";

export function PageForm(props: Parameters<typeof PageMenuFields>[0]) {
  return <PageMenuFields {...props} />;
}
