export class Validator {
    static requireTitle(title) {
        if (!title || !title.trim()) {
            throw new Error('Parameter "title" is required and must be a non-empty string.');
        }
    }
}
