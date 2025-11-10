export interface VkConfig {
  api_url: string;
  github_token?: string;
  github_username?: string;
}

export const DEFAULT_CONFIG: VkConfig = {
  api_url: "http://localhost:3000",
};
