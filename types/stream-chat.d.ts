import 'stream-chat';

declare module 'stream-chat' {
  interface CustomChannelData {
    name?: string;
    image?: string;
    whitelabel_host_id?: string;
  }
}
