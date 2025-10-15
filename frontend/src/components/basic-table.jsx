import React, { useState, useMemo, useEffect } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useAuth0 } from "@auth0/auth0-react";
import "../styles/basic-table.css";

const columnHelper = createColumnHelper();

const BasicTable = () => {
  const [data, setData] = useState([]);
  const [designationFilter, setDesignationFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSource, setLastSource] = useState("database");
  const { user } = useAuth0();

  const FILE_ID = "1KhF2Aoy3VzVrafxF1coRtRB_p2Xl7kSY";

  useEffect(() => {
    fetchEmployeesFromDatabase();
  }, []);

  // Fetch from backend database (fast)
  const fetchEmployeesFromDatabase = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/google/docs/employees");
      
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      
      const result = await response.json();
      setData(result.data || []);
      setLastSource("database");
      setLoading(false);
    } catch (error) {
      console.error("Error loading employees:", error);
      setData([]);
      setLoading(false);
    }
  };

  // Sync from Google Drive to database
  const syncFromGoogleDrive = async () => {
    if (!window.confirm("Sync the latest data from Google Drive?")) {
      return;
    }
    
    try {
      setSyncing(true);
      const userId = user?.sub || 'default_user';
      const response = await fetch(
        `http://localhost:5000/api/google/docs/sync-to-database/${FILE_ID}/${userId}`,
        { method: 'POST' }
      );
      
      if (!response.ok) {
        throw new Error("Sync failed");
      }
      
      const result = await response.json();
      alert(`Sync successful!\nInserted: ${result.inserted}\nUpdated: ${result.updated}`);
      
      // Refresh data from database after sync
      await fetchEmployeesFromDatabase();
      setLastSource("drive");
      
    } catch (error) {
      console.error("Sync error:", error);
      alert("Sync failed. Please ensure Google Docs is connected.");
    } finally {
      setSyncing(false);
    }
  };

  // Toggle button handler
  const handleRefreshToggle = () => {
    if (lastSource === "database") {
      syncFromGoogleDrive();
    } else {
      fetchEmployeesFromDatabase();
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => "Name",
        cell: (info) => info.getValue(),
        enableSorting: true,
      }),
      columnHelper.accessor("email", {
        header: () => "Email",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("designation", {
        header: () => "Designation",
        cell: (info) => info.getValue(),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    initialState: {
      sorting: [{ id: "name", desc: false }],
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const filteredRows = designationFilter
    ? table.getRowModel().rows.filter((row) =>
        row
          .getValue("designation")
          .toLowerCase()
          .startsWith(designationFilter.toLowerCase())
      )
    : table.getRowModel().rows;

  if (loading) {
    return <div className="table-container">Loading employee data...</div>;
  }

  return (
    <div className="table-container">
      <div className="filter-bar">
        <label htmlFor="designationFilter" className="filter-label">
          Filter by Designation:
        </label>
        <input
          id="designationFilter"
          type="text"
          value={designationFilter}
          onChange={(e) => setDesignationFilter(e.target.value)}
          placeholder="Enter designation..."
          className="filter-input"
        />
        <button
          onClick={() => setDesignationFilter("")}
          className="clear-btn"
        >
          Clear
        </button>
        <button
          onClick={handleRefreshToggle}
          disabled={loading || syncing}
          className="btn btn-primary"
          style={{ marginLeft: '10px' }}
        >
          {loading || syncing 
            ? 'Loading...' 
            : lastSource === "database" 
              ? 'Refresh from Drive'
              : 'Refresh from Database'
          }
        </button>
      </div>

      {data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p>No data available</p>
          <button onClick={syncFromGoogleDrive} className="btn btn-primary">
            Sync from Google Drive
          </button>
        </div>
      ) : (
        <table className="custom-table">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Showing {filteredRows.length} of {data.length} employees
        {lastSource === "drive" && (
          <span style={{ marginLeft: '1rem', color: 'var(--accent-primary)' }}>
            (Last synced from Google Drive)
          </span>
        )}
      </div>
    </div>
  );
};

export default BasicTable;