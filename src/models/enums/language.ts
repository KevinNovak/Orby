import { Lang } from '../../services';

export enum LangCode {
    EN_US = 'en-US',
}

export class Language {
    public static keyword(langCode: LangCode): string {
        return Lang.getRef('meta.language', langCode);
    }

    public static regex(langCode: LangCode): RegExp {
        return Lang.getRegex('meta.language', langCode);
    }

    public static displayName(langCode: LangCode): string {
        return Lang.getRef('meta.languageDisplay', langCode);
    }

    public static translators(langCode: LangCode): string {
        return Lang.getRef('meta.translators', langCode);
    }

    public static find(input: string): LangCode {
        for (let langCode of Object.values(LangCode)) {
            if (this.regex(langCode).test(input)) {
                return langCode;
            }
        }
    }

    public static list(): string {
        return Object.values(LangCode)
            .map(langCode => {
                return Lang.getRef('lists.languageItem', langCode, {
                    LANGUAGE_NAME: this.displayName(langCode),
                    LANGUAGE_KEYWORD: this.keyword(langCode),
                });
            })
            .join('\n')
            .trim();
    }
}
