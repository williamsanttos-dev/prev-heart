export type SendPushMessageExpoInput = {
  to: string;
  sound: 'default';
  title: string;
  body: string;
};

export interface ExpoPushClient {
  send(message: SendPushMessageExpoInput): Promise<void>;
}
