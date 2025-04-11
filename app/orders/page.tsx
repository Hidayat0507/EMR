'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GenerateBillButton } from "@/components/generate-bill-button";

interface Order {
  id: string;
  patientName: string;
  date: string;
  prescriptions: Array<{
    name: string;
    dosage: string;
    price: number;
  }>;
  procedures: Array<{
    name: string;
    description: string;
    price: number;
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([
    // Sample data - replace this with actual API call
    {
      id: "1",
      patientName: "John Doe",
      date: "2025-01-04",
      prescriptions: [
        { name: "Amoxicillin", dosage: "500mg", price: 25.00 },
        { name: "Ibuprofen", dosage: "200mg", price: 15.00 }
      ],
      procedures: [
        { name: "Blood Test", description: "Complete Blood Count", price: 75.00 },
        { name: "X-Ray", description: "Chest X-Ray", price: 150.00 }
      ]
    }
  ]);

  const calculateTotal = (order: Order) => {
    const prescriptionTotal = order.prescriptions.reduce((sum, item) => sum + item.price, 0);
    const procedureTotal = order.procedures.reduce((sum, item) => sum + item.price, 0);
    return prescriptionTotal + procedureTotal;
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Orders and Procedures</h1>
      
      {orders.map((order) => (
        <Card key={order.id} className="mb-6">
          <CardHeader>
            <CardTitle>
              Patient: {order.patientName}
              <span className="text-sm text-gray-500 ml-4">Date: {order.date}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Prescriptions</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.prescriptions.map((prescription, index) => (
                    <TableRow key={index}>
                      <TableCell>{prescription.name}</TableCell>
                      <TableCell>{prescription.dosage}</TableCell>
                      <TableCell>${prescription.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Procedures</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Procedure</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.procedures.map((procedure, index) => (
                    <TableRow key={index}>
                      <TableCell>{procedure.name}</TableCell>
                      <TableCell>{procedure.description}</TableCell>
                      <TableCell>${procedure.price.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="text-xl font-bold">
                Total: ${calculateTotal(order).toFixed(2)}
              </div>
              <GenerateBillButton patientData={order} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
