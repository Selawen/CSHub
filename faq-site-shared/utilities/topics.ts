// This is a recursive function which will get the topic from its hashs, if not, check the children (by calling iself on the children)
import {ITopic} from "../models";

export const getTopicFromHash = (topicHash: number, topics: ITopic[]): ITopic => {
    for (const topic of topics) {
        if (topic.hash === topicHash) {
            return topic;
        } else if (topic.children !== undefined) {
            const currTopic =  getTopicFromHash(topicHash, topic.children);
            if (currTopic !== null) {
                return currTopic;
            }
        }
    }
    return null;
};
