export default function TemplateSelector({ templates, selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {templates.map((template) => {
        const isSelected = selectedId === template.id;
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            className={`p-4 rounded-xl bg-white text-sm font-semibold text-slate-700 transition-all hover:bg-teal-50 ${
              isSelected ? 'shadow-md' : 'border border-slate-200'
            }`}
            style={isSelected ? { border: '2px solid #00bcd4' } : undefined}
          >
            {template.name}
          </button>
        );
      })}
    </div>
  );
}
