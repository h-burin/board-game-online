import { useMemo, useState } from 'react';
import { ItoGameLog } from '@/lib/hooks/useItoGameLogs';

export type SortField = 'createdAt' | 'number' | 'answer';

export function useLogFilters(logs: ItoGameLog[], questions: { [key: string]: string }) {
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>("all");
  const [selectedQuestion, setSelectedQuestion] = useState<string>("all");
  const [minNumber, setMinNumber] = useState<string>("");
  const [maxNumber, setMaxNumber] = useState<string>("");
  const [selectedEditStatus, setSelectedEditStatus] = useState<string>("all");
  const [selectedTestStatus, setSelectedTestStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Sort states
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'createdAt' ? 'desc' : 'asc');
    }
  };

  const filteredLogs = useMemo(() => {
    const filtered = logs.filter((log) => {
      // Age range filter
      if (selectedAgeRange !== "all" && log.ageRange !== selectedAgeRange) {
        return false;
      }

      // Question filter
      if (selectedQuestion !== "all" && log.questionId !== selectedQuestion) {
        return false;
      }

      // Number range filter (min/max)
      if (minNumber !== "") {
        const min = parseInt(minNumber);
        if (!isNaN(min) && log.number < min) return false;
      }
      if (maxNumber !== "") {
        const max = parseInt(maxNumber);
        if (!isNaN(max) && log.number > max) return false;
      }

      // Edit status filter
      if (selectedEditStatus !== "all") {
        if (selectedEditStatus === "edited" && !log.isEdited) return false;
        if (selectedEditStatus === "original" && log.isEdited) return false;
      }

      // Test status filter
      if (selectedTestStatus !== "all") {
        if (selectedTestStatus === "test" && !log.isTest) return false;
        if (selectedTestStatus === "real" && log.isTest) return false;
      }

      // Date range filter
      if (startDate || endDate) {
        const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : new Date(log.createdAt);

        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (logDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (logDate > end) return false;
        }
      }

      return true;
    });

    // Sort the filtered logs
    const sorted = [...filtered].sort((a, b) => {
      let compareValue = 0;

      switch (sortField) {
        case 'createdAt':
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          compareValue = dateA.getTime() - dateB.getTime();
          break;
        case 'number':
          compareValue = a.number - b.number;
          break;
        case 'answer':
          compareValue = a.answer.localeCompare(b.answer, 'th');
          break;
      }

      return sortDirection === 'asc' ? compareValue : -compareValue;
    });

    return sorted;
  }, [logs, selectedAgeRange, selectedQuestion, minNumber, maxNumber, selectedEditStatus, selectedTestStatus, startDate, endDate, sortField, sortDirection, questions]);

  const resetFilters = () => {
    setSelectedAgeRange("all");
    setSelectedQuestion("all");
    setMinNumber("");
    setMaxNumber("");
    setSelectedEditStatus("all");
    setSelectedTestStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    selectedAgeRange !== "all" ||
    selectedQuestion !== "all" ||
    minNumber !== "" ||
    maxNumber !== "" ||
    selectedEditStatus !== "all" ||
    selectedTestStatus !== "all" ||
    startDate !== "" ||
    endDate !== "";

  return {
    // States
    selectedAgeRange,
    setSelectedAgeRange,
    selectedQuestion,
    setSelectedQuestion,
    minNumber,
    setMinNumber,
    maxNumber,
    setMaxNumber,
    selectedEditStatus,
    setSelectedEditStatus,
    selectedTestStatus,
    setSelectedTestStatus,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    sortField,
    sortDirection,

    // Functions
    handleSort,
    resetFilters,

    // Computed
    filteredLogs,
    hasActiveFilters,
  };
}
