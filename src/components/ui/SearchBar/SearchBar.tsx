import React, { useState, useRef, useEffect, type ChangeEvent } from "react";
import MemberIcon from "../MemberIcon/MemberIcon";
import "./SearchBar.css";

export interface Member {
  id: string;
  name: string;
  initials?: string;
  backgroundColor?:
    | "blue"
    | "pink"
    | "green"
    | "purple"
    | "teal"
    | "yellow"
    | "auto";
  profilePicture?: string;
}

interface SearchBarProps {
  members?: Member[];
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSelect?: (member: Member) => void;
  onShowAll?: () => void;
  maxResults?: number;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  members = [],
  placeholder = "Search...",
  onSearch,
  onSelect,
  onShowAll,
  maxResults = 5,
  className = "",
}) => {
  const [query, setQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState<Member[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showAll) {
      setFilteredResults(members);
      setShowResults(true);
      if (onSearch) onSearch(query);
      return;
    }

    if (query.trim() === "") {
      setFilteredResults([]);
      setShowResults(false);
      if (onSearch) onSearch("");
      return;
    }

    const results = members
      .filter((member) =>
        member.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, maxResults);

    setFilteredResults(results);
    setShowResults(results.length > 0);

    if (onSearch) onSearch(query);
  }, [query, members, maxResults, onSearch, showAll]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowAll(false);

    if (value.length > 0) {
      setIsFocused(true);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);

    if (query.trim() === "") {
      setShowAll(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (containerRef.current) {
        const activeElement = document.activeElement;
        if (containerRef.current.contains(activeElement)) {
          return;
        }
      }
      setIsFocused(false);
      setShowResults(false);
      setShowAll(false);
    }, 150);
  };

  const clearQuery = () => {
    setQuery("");
    setShowResults(false);
    setIsFocused(true);
    setShowAll(true);
    inputRef.current?.focus();
  };

  const handleSelect = (member: Member) => {
    if (onSelect) onSelect(member);
    setQuery(member.name);
    setShowResults(false);
    setIsFocused(false);
    setShowAll(false);
  };

  const handleShowAll = () => {
    if (onShowAll) onShowAll();
    setShowAll(true);
    setShowResults(true);
    setIsFocused(true);
  };

  const shouldShowResults =
    showResults && isFocused && (query.trim() !== "" || showAll);

  return (
    <div ref={containerRef} className={`searchbar-container ${className}`}>
      {/* Search Input */}
      <div
        className={`searchbar-input-wrapper ${
          shouldShowResults ? "searchbar-input-wrapper--active" : ""
        }`}
      >
        <div className="searchbar-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="searchbar-input body-2"
          aria-label="Search members"
          autoComplete="off"
        />

        {query && (
          <button
            className="searchbar-clear"
            onClick={clearQuery}
            type="button"
            aria-label="Clear search"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results */}
      {shouldShowResults && (
        <div className="searchbar-results">
          <div className="searchbar-results-header overline">
            {showAll ? `All Items (${filteredResults.length})` : "Results"}
          </div>

          <ul className="searchbar-results-list">
            {filteredResults.map((member) => (
              <li
                key={member.id}
                className="searchbar-result-item"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(member)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSelect(member);
                }}
                role="button"
                tabIndex={0}
              >
                <MemberIcon
                  name={member.initials || member.name}
                  backgroundColor={member.backgroundColor || "auto"}
                  profilePicture={member.profilePicture}
                  size="small"
                  className="searchbar-result-avatar"
                />
                <span className="searchbar-result-name subtitle-3">
                  {member.name}
                </span>
              </li>
            ))}
          </ul>

          {/* Only show "All results" button when not already showing all */}
          {!showAll && (
            <button
              className="searchbar-show-all subtitle-2"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleShowAll}
              type="button"
            >
              All results
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
