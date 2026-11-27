import { jouerVideo } from "./video.js";

/** La cinématique du début, puis `suite()`. */
export function jouerIntro(suite) {
    jouerVideo("cinématique debut.mp4", suite);
}
