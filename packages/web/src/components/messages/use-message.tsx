import { createStore } from "solid-js/store";

type Config = {
  selected: string | null;
};

export const [message_topic, setMessageTopic] = createStore<Config>({
  selected: null,
});
