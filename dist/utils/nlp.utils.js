export class NLPUtils {
    static detectContentType(input) {
        const pageIndicators = ['page', 'landing', 'about', 'contact', 'services'];
        const lowercaseInput = input.toLowerCase();
        return pageIndicators.some((indicator) => lowercaseInput.includes(indicator))
            ? 'page'
            : 'post';
    }
    static detectPublishStatus(input) {
        if (/\b(publish|live|public)\b/i.test(input))
            return 'publish';
        if (/\b(private|hidden)\b/i.test(input))
            return 'private';
        return 'draft';
    }
}
