interface TagChipSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const TagChipSelector = ({ label, options, selected, onChange }: TagChipSelectorProps) => {
  const toggle = (item: string) => {
    onChange(
      selected.includes(item)
        ? selected.filter(i => i !== item)
        : [...selected, item]
    );
  };

  return (
    <div>
      <p className="label-caps text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => toggle(item)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-opacity ${
              selected.includes(item)
                ? 'bg-[#242242] text-white'
                : 'bg-warm-white text-[#242242] hover:opacity-85'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TagChipSelector;
