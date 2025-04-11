import {
  PropertyItemObjectResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";

export interface DatabaseRecord {
  id: string;
  likes: number;
  Keywords: string[];
  tags: string[];
  createdAt: string;
  slug: any;
  series: string;
  publishedAt: Date;
  isPublished: boolean;
  "meta-title": string;
  author: string;
  editedAt: string;
  "Automatic fields": any;
  archive: boolean;
  locale: string;
  "meta-summary": string;
  isProtected: boolean;
  Related: string[];
  summary: string;
  name: string;
}

export interface DatabaseProperties {
  likes: NotionProperty<"number">;
  Keywords: NotionProperty<"multi_select">;
  tags: NotionProperty<"multi_select">;
  createdAt: NotionProperty<"created_time">;
  slug: NotionProperty<"formula">;
  series: NotionProperty<"select">;
  publishedAt: NotionProperty<"date">;
  isPublished: NotionProperty<"checkbox">;
  "meta-title": NotionProperty<"rich_text">;
  author: NotionProperty<"rich_text">;
  editedAt: NotionProperty<"last_edited_time">;
  "Automatic fields": NotionProperty<"formula">;
  archive: NotionProperty<"checkbox">;
  locale: NotionProperty<"select">;
  "meta-summary": NotionProperty<"rich_text">;
  isProtected: NotionProperty<"checkbox">;
  Related: NotionProperty<"relation">;
  summary: NotionProperty<"rich_text">;
  name: NotionProperty<"title">;
}

export type NotionPropertyType =
  | "title"
  | "rich_text"
  | "number"
  | "select"
  | "multi_select"
  | "date"
  | "people"
  | "files"
  | "checkbox"
  | "url"
  | "email"
  | "phone_number"
  | "formula"
  | "relation"
  | "rollup"
  | "created_time"
  | "created_by"
  | "last_edited_time"
  | "last_edited_by";
export type NotionProperty<T extends NotionPropertyType> =
  PropertyItemObjectResponse;

export function getPropertyValue<T extends NotionPropertyType>(
  property: NotionProperty<T>
): any {
  switch (property.type) {
    case "title": {
      const titleProp = property as any;
      const richText = titleProp.title;
      return richText?.[0]?.plain_text ?? "";
    }
    case "rich_text": {
      const richTextProp = property as any;
      const richText = richTextProp.rich_text;
      return richText?.[0]?.plain_text ?? "";
    }
    case "number":
      return (property as any).number;
    case "select":
      return (property as any).select?.name ?? null;
    case "multi_select":
      return (property as any).multi_select.map((select: any) => select.name);
    case "date": {
      const dateProp = property as any;
      return dateProp.date ? new Date(dateProp.date.start) : null;
    }
    case "people": {
      const peopleProp = property as any;
      return Array.isArray(peopleProp.people)
        ? peopleProp.people.map((person: any) => ({
            id: person.id,
            name: person.name,
            avatar_url: person.avatar_url,
          }))
        : [];
    }
    case "files": {
      const filesProp = property as any;
      return filesProp.files.map((file: any) => ({
        name: file.name,
        url: file.type === "external" ? file.external.url : "",
      }));
    }
    case "checkbox":
      return (property as any).checkbox;
    case "url":
      return (property as any).url;
    case "email":
      return (property as any).email;
    case "phone_number":
      return (property as any).phone_number;
    case "formula":
      return (property as any).formula;
    case "relation": {
      const relationProp = property as any;
      return Array.isArray(relationProp.relation)
        ? relationProp.relation.map((rel: any) => rel.id)
        : [];
    }
    case "rollup":
      return (property as any).rollup;
    case "created_time":
      return (property as any).created_time;
    case "created_by": {
      const createdBy = (property as any).created_by;
      return {
        id: createdBy.id,
        name: createdBy.name,
        avatar_url: createdBy.avatar_url,
      };
    }
    case "last_edited_time":
      return (property as any).last_edited_time;
    case "last_edited_by": {
      const lastEditedBy = (property as any).last_edited_by;
      return {
        id: lastEditedBy.id,
        name: lastEditedBy.name,
        avatar_url: lastEditedBy.avatar_url,
      };
    }
    default:
      return null;
  }
}

export function simplifyNotionRecord(page: PageObjectResponse): DatabaseRecord {
  const result: Record<string, any> = {
    id: page.id,
  };

  for (const [key, value] of Object.entries(page.properties)) {
    result[key] = getPropertyValue(value as PropertyItemObjectResponse);
  }

  return result as DatabaseRecord;
}

export function simplifyNotionRecords(
  pages: PageObjectResponse[]
): DatabaseRecord[] {
  return pages.map((page) => simplifyNotionRecord(page));
}
