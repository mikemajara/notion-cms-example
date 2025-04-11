import { NotionCMS, SimpleBlock } from "notion-cms";
import { DatabaseRecord } from "../types/notion-types";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables from .env file
dotenv.config();

// Get Notion API token and database ID from environment variables
const NOTION_TOKEN = process.env.NOTION_TOKEN!;
const DATABASE_ID = process.env.NOTION_DATABASE_ID!;

// Create export directory if it doesn't exist
const EXPORT_DIR = path.join(__dirname, "../../exports");
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

async function main() {
  // Initialize the NotionCMS client with your token
  const notionCMS = new NotionCMS(NOTION_TOKEN);

  console.log("Initialized NotionCMS client");
  console.log("Database ID:", DATABASE_ID);

  // Fetch recent records from the database
  console.log("\nFetching recent records...");

  const recentRecords = await notionCMS.getDatabase<DatabaseRecord>(
    DATABASE_ID,
    {
      pageSize: 5,
      sorts: [{ property: "publishedAt", direction: "descending" }],
    }
  );

  console.log(`Found ${recentRecords.results.length} records`);

  // Display basic information about each record
  console.log("\nRecent Records:");
  recentRecords.results.forEach((record: DatabaseRecord, index: number) => {
    console.log(`\n[${index + 1}] ${record.name || "Untitled"}`);
    console.log(`  - ID: ${record.id}`);
    console.log(`  - Published: ${record.isPublished ? "Yes" : "No"}`);
    if (record.publishedAt) {
      console.log(`  - Date: ${record.publishedAt.toDateString()}`);
    }
    if (record.tags && record.tags.length > 0) {
      console.log(`  - Tags: ${record.tags.join(", ")}`);
    }
  });

  // Get a specific record for more detailed work
  if (recentRecords.results.length > 0) {
    const sampleRecord = recentRecords.results[0];
    console.log(
      `\nRetrieving full content for: ${sampleRecord.name || "Untitled"}`
    );

    // Get the content blocks
    const blocks = await notionCMS.getPageContent(sampleRecord.id, true);
    console.log(`Retrieved ${blocks.length} top-level blocks`);

    // Convert to both Markdown and HTML formats
    const markdown = notionCMS.blocksToMarkdown(blocks);
    const html = notionCMS.blocksToHtml(blocks);

    // Generate a slug if not available
    const slug =
      sampleRecord.slug ||
      (sampleRecord.name
        ? sampleRecord.name.toLowerCase().replace(/\s+/g, "-")
        : "untitled");

    // Save the content to files in the exports directory
    const mdFilePath = path.join(EXPORT_DIR, `${slug}.md`);
    const htmlFilePath = path.join(EXPORT_DIR, `${slug}.html`);

    fs.writeFileSync(mdFilePath, markdown);
    fs.writeFileSync(htmlFilePath, html);

    console.log(`Content exported to:`);
    console.log(`- Markdown: ${mdFilePath}`);
    console.log(`- HTML: ${htmlFilePath}`);

    // Create a simple table of contents
    console.log("\nTable of Contents:");
    const headings = blocks.filter((block: SimpleBlock) =>
      ["heading_1", "heading_2", "heading_3"].includes(block.type)
    );

    if (headings.length > 0) {
      headings.forEach((heading: SimpleBlock) => {
        const level = parseInt(heading.type.split("_")[1]);
        const indent = "  ".repeat(level - 1);
        console.log(`${indent}- ${heading.content.text}`);
      });
    } else {
      console.log("No headings found in the content.");
    }

    // Count images and other media
    const images = blocks.filter(
      (block: SimpleBlock) => block.type === "image"
    );
    const codeBlocks = blocks.filter(
      (block: SimpleBlock) => block.type === "code"
    );

    console.log("\nContent Statistics:");
    console.log(`- Images: ${images.length}`);
    console.log(`- Code blocks: ${codeBlocks.length}`);
    console.log(`- Total blocks: ${blocks.length}`);
  }

  // Demonstrate filtering records
  console.log("\nQuerying for published records only...");

  const publishedRecords =
    await notionCMS.getAllDatabaseRecords<DatabaseRecord>(DATABASE_ID, {
      filter: {
        property: "isPublished",
        checkbox: {
          equals: true,
        },
      },
    });

  console.log(`Found ${publishedRecords.length} published records`);
}

// Run the example
main().catch((error) => {
  console.error("Error running example:", error);
  process.exit(1);
});
