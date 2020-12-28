const ORB_COUNT_REGEX = /(.*)([\[\(\{]{1})([^-0-9,]*)([-]?\d{1,3}(?:,\d{3}|\d+)*(?:\.\d+)?)(([^-0-9,]*)([+][^-0-9,]*)([-]?\d{1,3}(?:,\d{3}|\d+)*(?:\.\d+)?))?(.*)([\]\)\}]{1})(.*)/;

export class RegexUtils {
    public static containsOrbs(input: string): boolean {
        return ORB_COUNT_REGEX.test(input);
    }

    public static extractClaimedOrbs(input: string): number {
        let match = ORB_COUNT_REGEX.exec(input);
        if (match && match[4]) {
            return parseInt(match[4].replace(/,/g, ''));
        }
    }

    public static extractInboxOrbs(input: string): number {
        let match = ORB_COUNT_REGEX.exec(input);
        if (match && match[8]) {
            return parseInt(match[8].replace(/,/g, ''));
        }
    }

    public static extractTotalOrbs(input: string): number {
        let claimedOrbs = this.extractClaimedOrbs(input);
        if (!claimedOrbs) {
            return;
        }

        let totalOrbs = claimedOrbs;

        let inboxOrbs = this.extractInboxOrbs(input);
        if (inboxOrbs) {
            totalOrbs += inboxOrbs;
        }

        return totalOrbs;
    }

    public static replaceClaimedOrbs(input: string, claimedOrbs: string): string {
        let oldClaimedOrbs = this.extractClaimedOrbs(input);
        if (oldClaimedOrbs == null) {
            return input;
        }

        return input.replace(ORB_COUNT_REGEX, `$1$2$3${claimedOrbs}$6$7$8$9$10$11`);
    }

    public static replaceInboxOrbs(input: string, inboxOrbs: string): string {
        let oldInboxOrbs = this.extractInboxOrbs(input);
        if (oldInboxOrbs == null) {
            return input;
        }

        return input.replace(ORB_COUNT_REGEX, `$1$2$3$4$6$7${inboxOrbs}$9$10$11`);
    }

    public static addInboxOrbs(input: string, inboxOrbs: string): string {
        return input.replace(ORB_COUNT_REGEX, `$1$2$3$4$6+${inboxOrbs}$9$10$11`);
    }

    public static removeInboxOrbs(input: string): string {
        return input.replace(ORB_COUNT_REGEX, `$1$2$3$4$6$9$10$11`);
    }
}
