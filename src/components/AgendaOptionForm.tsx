
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Option {
  id: string;
  title: string;
  description: string | null;
}

interface AgendaOptionFormProps {
  options: Option[];
  onOptionsChange: (options: Option[]) => void;
  isLoading?: boolean;
}

const AgendaOptionForm: React.FC<AgendaOptionFormProps> = ({ 
  options, 
  onOptionsChange, 
  isLoading 
}) => {
  // Generate a simple ID for new options
  const generateOptionId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add a new empty option to the list
  const handleAddOption = () => {
    const newOptions = [
      ...options,
      { id: generateOptionId(), title: "", description: "" }
    ];
    onOptionsChange(newOptions);
  };

  // Update an option's properties
  const handleOptionChange = (index: number, field: 'title' | 'description', value: string) => {
    // For description, limit to 1000 characters
    if (field === 'description' && value.length > 1000) {
      toast.warning("Resolution text is limited to 1000 characters");
      value = value.slice(0, 1000);
    }
    
    const updatedOptions = [...options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    onOptionsChange(updatedOptions);
  };

  // Remove an option
  const handleRemoveOption = (index: number) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    onOptionsChange(updatedOptions);
  };
  
  const remainingChars = (text: string | null, limit: number) => {
    return limit - (text?.length || 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Voting Options</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddOption}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Option
        </Button>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={option.id || index} className="border rounded-md p-4 pb-6 relative">
            <div className="absolute top-4 right-4">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOption(index)}
                disabled={isLoading || options.length <= 1}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor={`option-title-${index}`}>Option Title</Label>
                <Input
                  id={`option-title-${index}`}
                  value={option.title}
                  onChange={(e) => handleOptionChange(index, 'title', e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter option title"
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <Label htmlFor={`option-description-${index}`}>Resolution Text</Label>
                  <span className="text-xs text-gray-500">
                    {remainingChars(option.description, 1000)} characters remaining
                  </span>
                </div>
                <Textarea
                  id={`option-description-${index}`}
                  value={option.description || ''}
                  onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter resolution text"
                  className="mt-1 min-h-[100px]"
                  maxLength={1000}
                />
              </div>
            </div>
          </div>
        ))}

        {options.length === 0 && (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-gray-500">No options added yet. Click "Add Option" to add voting options.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaOptionForm;
