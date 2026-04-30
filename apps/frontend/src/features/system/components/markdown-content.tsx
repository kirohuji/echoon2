import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/cn'

export function MarkdownContent({ content }: { content: string }) {
  return (
    <article className="prose prose-sm max-w-none dark:prose-invert
      prose-headings:font-display prose-headings:tracking-tight
      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base
      prose-h2:mt-8 prose-h2:mb-4 prose-h3:mt-6 prose-h3:mb-3
      prose-p:leading-relaxed prose-p:text-foreground/85
      prose-li:leading-relaxed prose-li:text-foreground/85
      prose-strong:text-foreground prose-strong:font-semibold
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-table:w-full prose-table:overflow-x-auto
      prose-th:border prose-th:border-border prose-th:bg-muted/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold
      prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-sm
      prose-blockquote:border-l-primary prose-blockquote:bg-muted/30 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
      prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono
      prose-pre:bg-muted prose-pre:border prose-pre:border-border
      prose-img:rounded-xl
      [&_table]:block [&_table]:overflow-x-auto md:[&_table]:table
      [&_br]:hidden
    ">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  )
}
