import { 
  useEffect, 
  useState, 
  useRef, 
  forwardRef, 
  useImperativeHandle 
} from 'react';
import { Bold, Italic, List, Link as LinkIcon, Trash2, Image } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Block {
  id: string;
  type: 'text' | 'image' | 'button';
  content: string;
  url?: string;
}

interface EmailBuilderProps {
  content: string;
  onChange: (content: string) => void;
}

interface PendingImage {
  id: string;
  file: File;
}

const EmailBuilder = forwardRef<{ getPendingImages: () => PendingImage[] }, EmailBuilderProps>(
  ({ content, onChange }, ref) => {
    const [blocks, setBlocks] = useState<Block[]>(() => {
      try {
        return JSON.parse(content || '[]');
      } catch {
        return [];
      }
    });
    
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const prevContentRef = useRef(content);
    const prevBlocksRef = useRef(blocks);

    useEffect(() => {
      if (prevContentRef.current !== content) {
        try {
          const newBlocks = JSON.parse(content || '[]');
          setBlocks(newBlocks);
          prevContentRef.current = content;
        } catch {
          setBlocks([]);
        }
      }
    }, [content]);

    useEffect(() => {
      if (JSON.stringify(prevBlocksRef.current) !== JSON.stringify(blocks)) {
        const blocksJson = JSON.stringify(blocks);
        onChange(blocksJson);
        prevBlocksRef.current = blocks;
      }
    }, [blocks, onChange]);

    useImperativeHandle(ref, () => ({
      getPendingImages: () => pendingImages
    }));

    const addBlock = (type: Block['type']) => {
      const newBlock: Block = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        content: '',
      };
      setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id: string, updates: Partial<Block>) => {
      setBlocks(blocks.map(block => 
        block.id === id ? { ...block, ...updates } : block
      ));
    };

    const removeBlock = (id: string) => {
      setBlocks(blocks.filter(block => block.id !== id));
    };

    const handleDragEnd = (result: any) => {
      if (!result.destination) return;

      const items = Array.from(blocks);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);

      setBlocks(items);
    };

    const handleImageUpload = async (id: string) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const tempUrl = URL.createObjectURL(file);
        setPendingImages(prev => [...prev, { id, file }]);
        updateBlock(id, { content: tempUrl });
      };
      input.click();
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2 p-2 bg-gray-50 rounded-lg">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addBlock('text');
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50"
          >
            <List className="w-4 h-4 mr-2" />
            Add Text
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addBlock('image');
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50"
          >
            <Image className="w-4 h-4 mr-2" />
            Add Image
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              addBlock('button');
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md shadow-sm hover:bg-gray-50"
          >
            <LinkIcon className="w-4 h-4 mr-2" />
            Add Button
          </button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="email-blocks" type="block">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index} type="block">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                      >
                        {block.type === 'text' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    updateBlock(block.id, {
                                      content: block.content + '**bold text**'
                                    });
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Bold className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    updateBlock(block.id, {
                                      content: block.content + '_italic text_'
                                    });
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <Italic className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    updateBlock(block.id, {
                                      content: block.content + '[link text](url)'
                                    });
                                  }}
                                  className="p-1 hover:bg-gray-100 rounded"
                                >
                                  <LinkIcon className="w-4 h-4" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeBlock(block.id);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <textarea
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              className="w-full min-h-[100px] p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter your text here..."
                            />
                          </div>
                        )}

                        {block.type === 'image' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Image</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeBlock(block.id);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {block.content ? (
                              <div className="relative group">
                                <img
                                  src={block.content}
                                  alt="Email content"
                                  className="max-w-full h-auto rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleImageUpload(block.id);
                                  }}
                                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Change Image
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleImageUpload(block.id);
                                }}
                                className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:border-indigo-500 hover:text-indigo-500"
                              >
                                <Image className="w-6 h-6 mr-2" />
                                Upload Image
                              </button>
                            )}
                          </div>
                        )}

                        {block.type === 'button' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-700">Button</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeBlock(block.id);
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Button Text"
                            />
                            <input
                              type="url"
                              value={block.url || ''}
                              onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Button URL"
                            />
                            <div className="pt-2">
                              <button
                                type="button"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                                onClick={(e) => e.preventDefault()}
                              >
                                {block.content || 'Button Preview'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    );
  }
);

EmailBuilder.displayName = 'EmailBuilder';

export default EmailBuilder;