import { Copy } from 'lucide-react';

interface EmbedCodeGeneratorProps {
  clientId: string;
  onCopy: () => void;
  copied: boolean;
}

export function EmbedCodeGenerator({ clientId, onCopy, copied }: EmbedCodeGeneratorProps) {
  const embedCode = `<script>
  (function(w,d,s,c,i){
    w[c]=w[c]||function(){(w[c].q=w[c].q||[]).push(arguments)};
    var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s);
    j.async=true;
    j.src='https://cdn.yourdomain.com/tracker.js';
    j.onload=function(){w[c]('init',i)};
    f.parentNode.insertBefore(j,f);
  })(window,document,'script','NewsletterTracker','${clientId}');
</script>`;

  const copyEmbedCode = async () => {
    await navigator.clipboard.writeText(embedCode);
    onCopy();
  };

  return (
    <div>
      <div className="relative">
        <pre className="bg-gray-50 rounded-md p-4 overflow-x-auto text-sm font-mono">
          {embedCode}
        </pre>
        <button
          onClick={copyEmbedCode}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600 bg-white rounded-md shadow-sm"
          title="Copy to clipboard"
        >
          <Copy className="h-5 w-5" />
        </button>
      </div>
      {copied && (
        <span className="text-sm text-green-600 mt-2 inline-block">
          Embed code copied!
        </span>
      )}
    </div>
  );
} 