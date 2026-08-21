import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Power,
  Trash2,
  Tag,
} from 'lucide-react';
import { ItemCategory } from '../../../types/catalog';
import { Button } from '../../../components/ui/Button';

interface ItemCategoryTreeProps {
  categories: ItemCategory[];
  onAddSubcategory: (parentCategory: ItemCategory) => void;
  onEditCategory: (category: ItemCategory) => void;
  onDeactivateCategory: (category: ItemCategory) => void;
  onDeleteCategory: (category: ItemCategory) => void;
}

interface TreeNodeProps {
  key?: string;
  category: ItemCategory;
  allCategories: ItemCategory[];
  level: number;
  onAddSubcategory: (parentCategory: ItemCategory) => void;
  onEditCategory: (category: ItemCategory) => void;
  onDeactivateCategory: (category: ItemCategory) => void;
  onDeleteCategory: (category: ItemCategory) => void;
}

function CategoryTreeNode({
  category,
  allCategories,
  level,
  onAddSubcategory,
  onEditCategory,
  onDeactivateCategory,
  onDeleteCategory,
}: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Find direct child categories
  const children = allCategories.filter((c) => c.parent_id === category.id);
  const hasChildren = (children || []).length > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
          category.is_active
            ? 'bg-white hover:bg-slate-50/80 border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800/50'
            : 'bg-slate-50 border-slate-200/50 opacity-60 dark:bg-slate-950 dark:border-slate-800'
        }`}
        style={{ marginRight: `${level * 1.5}rem` }}
      >
        <div className="flex items-center gap-3">
          {hasChildren ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div
            className={`p-2 rounded-lg ${
              category.parent_id
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
            }`}
          >
            {hasChildren && isOpen ? (
              <FolderOpen className="w-4 h-4" />
            ) : hasChildren ? (
              <Folder className="w-4 h-4" />
            ) : (
              <Tag className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                {category.name}
              </span>
              {!category.is_active && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  غیرفعال
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {category.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            onClick={() => onAddSubcategory(category)}
            title="افزودن زیرمجموعه"
          >
            <Plus className="w-3.5 h-3.5 ml-1" />
            <span className="hidden sm:inline">زیرمجموعه</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => onEditCategory(category)}
            title="ویرایش"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className={`text-xs ${
              category.is_active
                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
            onClick={() => onDeactivateCategory(category)}
            title={category.is_active ? 'غیرفعال کردن' : 'فعال‌سازی'}
          >
            <Power className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            onClick={() => onDeleteCategory(category)}
            title="حذف کامل"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-2 space-y-2 relative before:absolute before:right-3 before:top-0 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {(children || []).map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              allCategories={allCategories}
              level={level + 1}
              onAddSubcategory={onAddSubcategory}
              onEditCategory={onEditCategory}
              onDeactivateCategory={onDeactivateCategory}
              onDeleteCategory={onDeleteCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ItemCategoryTree({
  categories,
  onAddSubcategory,
  onEditCategory,
  onDeactivateCategory,
  onDeleteCategory,
}: ItemCategoryTreeProps) {
  // Top-level categories (parent_id is null or not found in list)
  const rootCategories = categories.filter(
    (c) => !c.parent_id || !categories.some((p) => p.id === c.parent_id)
  );

  if ((categories || []).length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {(rootCategories || []).map((cat) => (
        <CategoryTreeNode
          key={cat.id}
          category={cat}
          allCategories={categories}
          level={0}
          onAddSubcategory={onAddSubcategory}
          onEditCategory={onEditCategory}
          onDeactivateCategory={onDeactivateCategory}
          onDeleteCategory={onDeleteCategory}
        />
      ))}
    </div>
  );
}
