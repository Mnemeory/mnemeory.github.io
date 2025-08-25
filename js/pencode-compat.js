/**
 * Pencode Compatibility Layer - Nralakk Federation Nlom Interface
 *
 * Provides compatibility between pencode and HTML for document rendering
 * Adapted for Federation document standards and Skrell cultural requirements
 */

export class PencodeCompat {
  /**
   * Convert pencode to HTML
   */
  static toHtml(rawText, opts = {}) {
    if (!rawText) return "";

    let html = rawText
      // Basic formatting
      .replace(/\[b\](.*?)\[\/b\]/gi, "<strong>$1</strong>")
      .replace(/\[i\](.*?)\[\/i\]/gi, "<em>$1</em>")
      .replace(/\[u\](.*?)\[\/u\]/gi, "<u>$1</u>")
      .replace(/\[h1\](.*?)\[\/h1\]/gi, "<h1>$1</h1>")
      .replace(/\[h2\](.*?)\[\/h2\]/gi, "<h2>$1</h2>")
      .replace(/\[h3\](.*?)\[\/h3\]/gi, "<h3>$1</h3>")
      .replace(
        /\[center\](.*?)\[\/center\]/gi,
        '<div style="text-align: center;">$1</div>'
      )
      .replace(/\[list\](.*?)\[\/list\]/gi, "<ul>$1</ul>")
      .replace(/\[\*\]/gi, "<li>")
      .replace(/\[br\]/gi, "<br>")
      .replace(/\[hr\]/gi, "<hr>")

      // Convert line breaks
      .replace(/\n/g, "<br>");

    // Apply Federation styling classes
    if (opts.federationStyle !== false) {
      html = html.replace(
        /<h1>/g,
        '<h1 class="federation-heading federation-heading--primary">'
      );
      html = html.replace(
        /<h2>/g,
        '<h2 class="federation-heading federation-heading--secondary">'
      );
      html = html.replace(
        /<h3>/g,
        '<h3 class="federation-heading federation-heading--tertiary">'
      );
      html = html.replace(/<p>/g, '<p class="federation-paragraph">');
    }

    return html;
  }

  /**
   * Convert HTML back to pencode
   */
  static htmlToPencode(html, opts = {}) {
    if (!html) return "";

    let pencode = html
      // Remove Federation styling classes
      .replace(/class="[^"]*"/g, "")
      .replace(/class='[^']*'/g, "")

      // Convert HTML back to pencode
      .replace(/<strong>(.*?)<\/strong>/gi, "[b]$1[/b]")
      .replace(/<em>(.*?)<\/em>/gi, "[i]$1[/i]")
      .replace(/<u>(.*?)<\/u>/gi, "[u]$1[/u]")
      .replace(/<h1>(.*?)<\/h1>/gi, "[h1]$1[/h1]")
      .replace(/<h2>(.*?)<\/h2>/gi, "[h2]$1[/h2]")
      .replace(/<h3>(.*?)<\/h3>/gi, "[h3]$1[/h3]")
      .replace(
        /<div[^>]*style="[^"]*text-align:\s*center[^"]*"[^>]*>(.*?)<\/div>/gi,
        "[center]$1[/center]"
      )
      .replace(/<ul>(.*?)<\/ul>/gi, "[list]$1[/list]")
      .replace(/<li>/gi, "[*]")
      .replace(/<br\s*\/?>/gi, "[br]")
      .replace(/<hr\s*\/?>/gi, "[hr]")

      // Convert line breaks back
      .replace(/<br\s*\/?>/gi, "\n")

      // Clean up extra whitespace
      .replace(/\n\s*\n/g, "\n\n")
      .trim();

    return pencode;
  }

  /**
   * Sanitize HTML for safe display
   */
  static sanitizeHtml(html) {
    if (!html) return "";

    // Remove potentially dangerous tags and attributes
    const allowedTags = [
      "b",
      "i",
      "u",
      "h1",
      "h2",
      "h3",
      "p",
      "br",
      "hr",
      "ul",
      "li",
      "div",
      "span",
    ];
    const allowedAttributes = ["class", "style"];

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Recursively sanitize nodes
    this.sanitizeNode(tempDiv, allowedTags, allowedAttributes);

    return tempDiv.innerHTML;
  }

  /**
   * Recursively sanitize DOM nodes
   */
  static sanitizeNode(node, allowedTags, allowedAttributes) {
    if (node.nodeType === Node.TEXT_NODE) {
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      // Remove disallowed tags
      if (!allowedTags.includes(tagName)) {
        node.remove();
        return;
      }

      // Remove disallowed attributes
      const attributes = Array.from(node.attributes);
      attributes.forEach((attr) => {
        if (!allowedAttributes.includes(attr.name)) {
          node.removeAttribute(attr.name);
        }
      });

      // Sanitize child nodes
      const children = Array.from(node.childNodes);
      children.forEach((child) => {
        this.sanitizeNode(child, allowedTags, allowedAttributes);
      });
    }
  }

  /**
   * Extract plain text from HTML
   */
  static htmlToText(html) {
    if (!html) return "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    return tempDiv.textContent || tempDiv.innerText || "";
  }

  /**
   * Validate pencode syntax
   */
  static validatePencode(pencode) {
    if (!pencode) return { isValid: true, errors: [] };

    const errors = [];
    const openTags = [];

    // Check for balanced tags
    const tagRegex = /\[(\/?)([^\]]+)\]/g;
    let match;

    while ((match = tagRegex.exec(pencode)) !== null) {
      const isClosing = match[1] === "/";
      const tagName = match[2].toLowerCase();

      if (isClosing) {
        if (openTags.length === 0 || openTags.pop() !== tagName) {
          errors.push(`Unmatched closing tag: [/${tagName}]`);
        }
      } else {
        openTags.push(tagName);
      }
    }

    // Check for unclosed tags
    openTags.forEach((tag) => {
      errors.push(`Unclosed tag: [${tag}]`);
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
