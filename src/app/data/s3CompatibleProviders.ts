/**
 * Top S3-compatible object storage providers for admin plugin picker.
 * Placeholders are illustrative; real endpoints depend on account and region.
 */
export const S3_COMPATIBLE_PROVIDERS = [
  {
    id: "aws-s3",
    label: "Amazon S3",
    endpointPlaceholder: "https://s3.eu-central-1.amazonaws.com",
    regionPlaceholder: "eu-central-1",
    hint: "Leave empty to use the default AWS SDK resolver, or set a custom endpoint / VPC endpoint URL.",
  },
  {
    id: "cloudflare-r2",
    label: "Cloudflare R2",
    endpointPlaceholder: "https://<account-id>.r2.cloudflarestorage.com",
    regionPlaceholder: "auto",
    hint: "R2 commonly uses region “auto”; authenticate with S3 API tokens from the dashboard.",
  },
  {
    id: "minio",
    label: "MinIO",
    endpointPlaceholder: "https://minio.example.com:9000",
    regionPlaceholder: "us-east-1",
    hint: "Self-hosted clusters often need path-style addressing or custom TLS.",
  },
  {
    id: "backblaze-b2",
    label: "Backblaze B2 (S3)",
    endpointPlaceholder: "https://s3.eu-central-003.backblazeb2.com",
    regionPlaceholder: "eu-central-003",
    hint: "Use the S3-compatible endpoint and an application key with the right bucket scope.",
  },
  {
    id: "wasabi",
    label: "Wasabi",
    endpointPlaceholder: "https://s3.eu-central-1.wasabisys.com",
    regionPlaceholder: "eu-central-1",
    hint: "Wasabi region IDs follow an AWS-like naming pattern.",
  },
  {
    id: "digitalocean-spaces",
    label: "DigitalOcean Spaces",
    endpointPlaceholder: "https://fra1.digitaloceanspaces.com",
    regionPlaceholder: "fra1",
    hint: "The region slug (e.g. nyc3, ams3) is part of the endpoint hostname.",
  },
  {
    id: "alibaba-oss",
    label: "Alibaba Cloud OSS (S3)",
    endpointPlaceholder: "https://oss-eu-central-1.aliyuncs.com",
    regionPlaceholder: "eu-central-1",
    hint: "Enable S3-compatible API on the bucket if required by your SDK.",
  },
  {
    id: "scaleway",
    label: "Scaleway Object Storage",
    endpointPlaceholder: "https://s3.fr-par.scw.cloud",
    regionPlaceholder: "fr-par",
    hint: "Match the Scaleway region code (nl-ams, pl-waw, …) with the endpoint you use.",
  },
  {
    id: "ibm-cos",
    label: "IBM Cloud Object Storage",
    endpointPlaceholder: "https://s3.eu-de.cloud-object-storage.appdomain.cloud",
    regionPlaceholder: "eu-de",
    hint: "Endpoint varies by COS instance location and bucket resiliency option.",
  },
  {
    id: "oracle-oci",
    label: "Oracle Cloud Object Storage",
    endpointPlaceholder: "https://<namespace>.compat.objectstorage.<region>.oraclecloud.com",
    regionPlaceholder: "eu-frankfurt-1",
    hint: "Namespace and region come from the OCI console; uses S3 interoperability API.",
  },
] as const;

export type S3CompatibleProviderId = (typeof S3_COMPATIBLE_PROVIDERS)[number]["id"];

export function getS3ProviderMeta(id: string) {
  return S3_COMPATIBLE_PROVIDERS.find((p) => p.id === id) ?? S3_COMPATIBLE_PROVIDERS[0];
}

export function isKnownS3ProviderId(id: string): id is S3CompatibleProviderId {
  return S3_COMPATIBLE_PROVIDERS.some((p) => p.id === id);
}
