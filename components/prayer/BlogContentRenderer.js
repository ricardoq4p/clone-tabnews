import { parseBlogContentBlocks } from "@/lib/blogs";

function renderInlineTokens(tokens = []) {
  return tokens.map((token, idx) => {
    if (token.type === "strong") {
      return <strong key={idx}>{token.text}</strong>;
    }
    if (token.type === "em") {
      return <em key={idx}>{token.text}</em>;
    }
    return <span key={idx}>{token.text}</span>;
  });
}

export default function BlogContentRenderer({ content = "" }) {
  const blocks = parseBlogContentBlocks(content);
  if (!blocks.length) return null;

  return (
    <div className="pl-blog-article-body">
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2 key={index} id={block.id} className="pl-blog-heading-h2">
              {renderInlineTokens(block.tokens)}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={index} id={block.id} className="pl-blog-heading-h3">
              {renderInlineTokens(block.tokens)}
            </h3>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={index} className="pl-blog-list">
              {block.items.map((itemTokens, itemIndex) => (
                <li key={itemIndex}>{renderInlineTokens(itemTokens)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={index} className="pl-blog-list pl-blog-list-ordered">
              {block.items.map((itemTokens, itemIndex) => (
                <li key={itemIndex}>{renderInlineTokens(itemTokens)}</li>
              ))}
            </ol>
          );
        }
        return <p key={index}>{renderInlineTokens(block.tokens)}</p>;
      })}
    </div>
  );
}
