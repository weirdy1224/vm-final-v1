"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios"; // Make sure to install axios

export default function Dashboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from backend
  useEffect(() => {
    const fetchScores = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("No token found in localStorage.");
          setLoading(false);
          return;
        }
        const response = await axios.get(
          "http://localhost:5000/api/cvss-scores",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          const fetchedScores = response.data.data;
          // Group the scores into ranges
          const ranges = [
            { range: "0-1", value: 0 },
            { range: "1-2", value: 0 },
            { range: "2-3", value: 0 },
            { range: "3-4", value: 0 },
            { range: "4-5", value: 0 },
            { range: "5-6", value: 0 },
            { range: "6-7", value: 0 },
            { range: "7-8", value: 0 },
            { range: "8-9", value: 0 },
            { range: "9+", value: 0 },
          ];

          // Group the CVSS scores into ranges
          fetchedScores.forEach((score) => {
            if (score <= 1) ranges[0].value++;
            else if (score <= 2) ranges[1].value++;
            else if (score <= 3) ranges[2].value++;
            else if (score <= 4) ranges[3].value++;
            else if (score <= 5) ranges[4].value++;
            else if (score <= 6) ranges[5].value++;
            else if (score <= 7) ranges[6].value++;
            else if (score <= 8) ranges[7].value++;
            else if (score <= 9) ranges[8].value++;
            else ranges[9].value++;
          });

          setScores(ranges);
        }
      } catch (error) {
        console.error("Error fetching CVSS scores:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  // Find the maximum value to calculate relative widths
  const maxValue = Math.max(...scores.map((score) => score.value), 1);

  // Function to determine color based on range
  const getColor = (range) => {
    const [start] = range.split("-").map(Number);
    if (start <= 1) return "bg-green-500";
    if (start <= 3) return "bg-yellow-500";
    if (start <= 5) return "bg-orange-500";
    if (start <= 7) return "bg-red-500";
    return "bg-red-900";
  };

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading CVSS Scores...</CardTitle>
          </CardHeader>
          <CardContent>
            <div>Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>CVSS Score Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scores.map((score, index) => (
              <div key={index} className="flex items-center">
                <div className="w-12 text-sm text-gray-600">{score.range}</div>
                <div className="flex-1 h-6 flex items-center">
                  <div
                    className={`h-1.5 rounded-full ${getColor(
                      score.range
                    )} transition-all duration-500`}
                    style={{
                      width: `${(score.value / maxValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
