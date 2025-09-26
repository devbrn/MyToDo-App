import React, { useState } from 'react';
import { 
  InboxIcon, 
  CalendarIcon, 
  FolderIcon, 
  TagIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  PlusIcon,
  EditIcon,
  DeleteIcon
} from './icons';
import { Project, Tag } from '@/services/api';

interface SidebarProps {
  projects: Project[];
  tags: Tag[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onCreateTag: () => void;
  onEditTag: (tag: Tag) => void;
  onDeleteTag: (tagId: string) => void;
}

/**
 * Componente de menu lateral com seções de filtros
 */
export function Sidebar({ 
  projects, 
  tags, 
  selectedFilter, 
  onFilterChange,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onCreateTag,
  onEditTag,
  onDeleteTag
}: SidebarProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(true);

  const mainSections = [
    { id: 'inbox', label: 'INBOX', icon: InboxIcon },
    { id: 'today', label: 'HOJE', icon: CalendarIcon },
    { id: 'tomorrow', label: 'AMANHÃ', icon: CalendarIcon },
    { id: 'upcoming', label: 'Próximos dias', icon: CalendarIcon },
  ];

  return (
    <aside className="sidebar">
      {/* Seções principais */}
      <nav className="main-nav">
        {mainSections.map((section) => {
          const IconComponent = section.icon;
          return (
            <button
              key={section.id}
              className={`nav-item ${selectedFilter === section.id ? 'active' : ''}`}
              onClick={() => onFilterChange(section.id)}
            >
              <IconComponent className="nav-icon" />
              <span className="nav-label">{section.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Divisor */}
      <div className="divider" />

      {/* Seção de Projetos */}
      <div className="section">
        <div className="section-header-container">
          <button
            className="section-header"
            onClick={() => setProjectsExpanded(!projectsExpanded)}
          >
            {projectsExpanded ? (
              <ChevronDownIcon className="chevron-icon" />
            ) : (
              <ChevronRightIcon className="chevron-icon" />
            )}
            <FolderIcon className="section-icon" />
            <span className="section-title">Projetos</span>
          </button>
          <button
            className="add-button"
            onClick={onCreateProject}
            title="Criar novo projeto"
          >
            <PlusIcon size={14} />
          </button>
        </div>

        {projectsExpanded && (
          <div className="section-items">
            {projects.length === 0 ? (
              <div className="empty-state">Nenhum projeto</div>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="section-item-container">
                  <button
                    className={`section-item ${selectedFilter === `project:${project.name}` ? 'active' : ''}`}
                    onClick={() => onFilterChange(`project:${project.name}`)}
                  >
                    <FolderIcon className="item-icon" />
                    <span className="item-label">{project.name}</span>
                  </button>
                  <div className="item-actions">
                    <button
                      className="item-action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditProject(project);
                      }}
                      title="Editar projeto"
                    >
                      <EditIcon size={12} />
                    </button>
                    <button
                      className="item-action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      title="Excluir projeto"
                    >
                      <DeleteIcon size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Divisor */}
      <div className="divider" />

      {/* Seção de Tags */}
      <div className="section">
        <div className="section-header-container">
          <button
            className="section-header"
            onClick={() => setTagsExpanded(!tagsExpanded)}
          >
            {tagsExpanded ? (
              <ChevronDownIcon className="chevron-icon" />
            ) : (
              <ChevronRightIcon className="chevron-icon" />
            )}
            <TagIcon className="section-icon" />
            <span className="section-title">Tags</span>
          </button>
          <button
            className="add-button"
            onClick={onCreateTag}
            title="Criar nova tag"
          >
            <PlusIcon size={14} />
          </button>
        </div>

        {tagsExpanded && (
          <div className="section-items">
            {tags.length === 0 ? (
              <div className="empty-state">Nenhuma tag</div>
            ) : (
              tags.map((tag) => (
                <div key={tag.id} className="section-item-container">
                  <button
                    className={`section-item ${selectedFilter === `tag:${tag.name}` ? 'active' : ''}`}
                    onClick={() => onFilterChange(`tag:${tag.name}`)}
                  >
                    <TagIcon className="item-icon" />
                    <span className="item-label">#{tag.name}</span>
                  </button>
                  <div className="item-actions">
                    <button
                      className="item-action-btn edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTag(tag);
                      }}
                      title="Editar tag"
                    >
                      <EditIcon size={12} />
                    </button>
                    <button
                      className="item-action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Tem certeza que deseja excluir a tag "${tag.name}"?`)) {
                          onDeleteTag(tag.id);
                        }
                      }}
                      title="Excluir tag"
                    >
                      <DeleteIcon size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 280px;
          height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          z-index: 100;
        }

        .main-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .nav-item:hover {
          background: var(--bg-hover);
        }

        .nav-item.active {
          background: var(--accent-bg);
          color: var(--accent-color);
          font-weight: 600;
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          flex-shrink: 0;
        }

        .nav-label {
          font-size: 14px;
          font-weight: 500;
        }

        .divider {
          height: 1px;
          background: var(--border-color);
          margin: 8px 0;
        }

        .section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .section-header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 4px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          flex: 1;
        }

        .add-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #6b7280;
        }

        .add-button:hover {
          background: var(--bg-hover);
          color: var(--accent-color);
        }
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          width: 100%;
        }

        .section-header:hover {
          background: var(--bg-hover);
        }

        .chevron-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .section-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-items {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-left: 22px;
        }

        .section-item-container {
          display: flex;
          align-items: center;
          gap: 4px;
          position: relative;
        }

        .section-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          flex: 1;
        }

        .item-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .section-item-container:hover .item-actions {
          opacity: 1;
        }

        .item-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-muted);
        }

        .item-action-btn:hover {
          background: var(--bg-hover);
        }

        .edit-btn:hover {
          color: var(--accent-color);
        }

        .delete-btn:hover {
          color: var(--danger-color);
        }

        .section-item:hover {
          background: var(--bg-hover);
        }

        .section-item.active {
          background: var(--accent-bg);
          color: var(--accent-color);
          font-weight: 500;
        }

        .item-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .item-label {
          font-size: 13px;
        }

        .empty-state {
          padding: 8px 12px;
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
        }

        /* Responsividade */
        @media (max-width: 768px) {
          .sidebar {
            position: relative; /* Voltar ao posicionamento normal em mobile */
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border-color);
            padding: 16px;
          }

          .main-nav {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 8px;
          }

          .nav-item {
            flex: 1;
            min-width: 120px;
            justify-content: center;
            padding: 8px 12px;
          }

          .nav-label {
            font-size: 12px;
          }

          .section {
            margin-top: 16px;
          }
        }
      `}</style>
    </aside>
  );
}