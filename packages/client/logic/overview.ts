import { ref } from "vue";
import { rawRoutes } from "../routes";

export const currentOverviewPage = ref(0);

export function prevOverviewPage() {
    if (currentOverviewPage.value > 1) {
        currentOverviewPage.value -= 1;
    }
}

export function nextOverviewPage() {
    if (currentOverviewPage.value < rawRoutes.length - 1) {
        currentOverviewPage.value += 1;
    }
}
