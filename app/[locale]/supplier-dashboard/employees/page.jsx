"use client";

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import CreatableSelect from "react-select/creatable";
import { useTranslations, useLocale } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
  TableHead as TableHeadCell,
} from "@/components/ui/table";

const roleOptions = [
  { value: "Supplier Admin", label: "Supplier Admin" },
  { value: "Product Manager", label: "Product Manager" },
  { value: "Order Manager", label: "Order Manager" },
  {
    value: "Customer Service Representative",
    label: "Customer Service Representative",
  },
  { value: "Inventory Coordinator", label: "Inventory Coordinator" },
];

export default function ManageEmployees({ supplierId: passedSupplierId }) {
  const t = useTranslations("supplier-employees");
  const locale = useLocale();
  const isRtl = locale === "ar";

  const [employees, setEmployees] = useState([]);
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    email: "",
    username: "",
    password: "",
  });
  const [editMode, setEditMode] = useState(null);
  const [supplierId, setSupplierId] = useState(passedSupplierId || null);
  const auth = getAuth();

  const fetchEmployees = useCallback(async () => {
    if (!supplierId) {
      console.error(t("missing_supplier_id"));
      return;
    }

    try {
      const q = query(
        collection(db, "employees"),
        where("supplierId", "==", supplierId)
      );
      const data = await getDocs(q);
      setEmployees(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    } catch (error) {
      console.error(t("fetch_employees_error"), error);
    }
  }, [supplierId, t]);

  useEffect(() => {
    if (!passedSupplierId) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) setSupplierId(user.uid);
        else console.error(t("user_not_authenticated"));
      });
      return () => unsubscribe();
    }
  }, [auth, passedSupplierId, t]);

  useEffect(() => {
    if (supplierId) fetchEmployees();
  }, [supplierId, fetchEmployees]);

  const addEmployee = async () => {
    if (!supplierId) {
      console.error(t("missing_supplier_id"));
      return;
    }
    const { name, role, email, username, password } = newEmployee;
    if (!name || !role || !email || !username || !password) {
      console.error(t("all_fields_required"));
      return;
    }
    try {
      await addDoc(collection(db, "employees"), {
        ...newEmployee,
        supplierId,
      });
      console.log(t("added"));
      fetchEmployees();
      resetForm();
    } catch (error) {
      console.error(t("add_employee_error"), error);
    }
  };

  const updateEmployee = async (id) => {
    try {
      const employeeDoc = doc(db, "employees", id);
      await updateDoc(employeeDoc, newEmployee);
      console.log(t("updated"));
      fetchEmployees();
      resetForm();
      setEditMode(null);
    } catch (error) {
      console.error(t("update_employee_error"), error);
    }
  };

  const deleteEmployee = async (id) => {
    try {
      const employeeDoc = doc(db, "employees", id);
      await deleteDoc(employeeDoc);
      console.log(t("deleted"));
      fetchEmployees();
    } catch (error) {
      console.error(t("delete_employee_error"), error);
    }
  };

  const resetForm = () => {
    setNewEmployee({
      name: "",
      role: "",
      email: "",
      username: "",
      password: "",
    });
  };

  return (
    <div className='w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6'>
      <Card className='p-4 sm:p-6 mb-6'>
        <h2
          className={`text-xl font-semibold mb-2 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          {t("manage")}
        </h2>
        <p
          className={`text-sm text-muted-foreground mb-4 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          {t("description")}
        </p>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              className={`text-sm font-medium block ${
                isRtl ? "text-right" : "text-left"
              }`}
            >
              {t("name")}
            </label>
            <Input
              className='w-full mb-3'
              value={newEmployee.name}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, name: e.target.value })
              }
              placeholder={t("enter_name")}
            />

            <label
              className={`text-sm font-medium block ${
                isRtl ? "text-right" : "text-left"
              }`}
            >
              {t("role")}
            </label>
            <CreatableSelect
              options={roleOptions}
              placeholder={t("select_or_create_role")}
              value={
                newEmployee.role
                  ? { value: newEmployee.role, label: newEmployee.role }
                  : null
              }
              onChange={(selectedOption) =>
                setNewEmployee({
                  ...newEmployee,
                  role: selectedOption ? selectedOption.value : "",
                })
              }
              className='mb-3'
              classNamePrefix='react-select'
              styles={{
                control: (base) => ({
                  ...base,
                  direction: isRtl ? "rtl" : "ltr",
                }),
                input: (base) => ({
                  ...base,
                  textAlign: isRtl ? "right" : "left",
                }),
                singleValue: (base) => ({
                  ...base,
                  textAlign: isRtl ? "right" : "left",
                }),
              }}
            />
          </div>

          <div>
            <label
              className={`text-sm font-medium block ${
                isRtl ? "text-right" : "text-left"
              }`}
            >
              {t("email")}
            </label>
            <Input
              className='w-full mb-3'
              value={newEmployee.email}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, email: e.target.value })
              }
              placeholder={t("enter_email")}
            />

            <label
              className={`text-sm font-medium block ${
                isRtl ? "text-right" : "text-left"
              }`}
            >
              {t("username")}
            </label>
            <Input
              className='w-full mb-3'
              value={newEmployee.username}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, username: e.target.value })
              }
              placeholder={t("enter_username")}
            />

            <label
              className={`text-sm font-medium block ${
                isRtl ? "text-right" : "text-left"
              }`}
            >
              {t("password")}
            </label>
            <Input
              type='password'
              className='w-full mb-3'
              value={newEmployee.password}
              onChange={(e) =>
                setNewEmployee({ ...newEmployee, password: e.target.value })
              }
              placeholder={t("enter_password")}
            />
          </div>
        </div>

        <Button
          onClick={editMode ? () => updateEmployee(editMode) : addEmployee}
          className='w-full sm:w-auto mt-4'
        >
          {editMode ? t("update") : t("add")}
        </Button>
      </Card>

      <Card className='p-4 sm:p-6'>
        <h3
          className={`text-lg font-semibold mb-4 ${
            isRtl ? "text-right" : "text-left"
          }`}
        >
          {t("current")}
        </h3>

        <div className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeadCell className={isRtl ? "text-right" : "text-left"}>
                  {t("name")}
                </TableHeadCell>
                <TableHeadCell className={isRtl ? "text-right" : "text-left"}>
                  {t("role")}
                </TableHeadCell>
                <TableHeadCell className={isRtl ? "text-right" : "text-left"}>
                  {t("email")}
                </TableHeadCell>
                <TableHeadCell className={isRtl ? "text-right" : "text-left"}>
                  {t("username")}
                </TableHeadCell>
                <TableHeadCell className={isRtl ? "text-right" : "text-left"}>
                  {t("actions")}
                </TableHeadCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className={isRtl ? "text-right" : "text-left"}>
                    {employee.name}
                  </TableCell>
                  <TableCell className={isRtl ? "text-right" : "text-left"}>
                    {employee.role}
                  </TableCell>
                  <TableCell className={isRtl ? "text-right" : "text-left"}>
                    {employee.email}
                  </TableCell>
                  <TableCell className={isRtl ? "text-right" : "text-left"}>
                    {employee.username}
                  </TableCell>
                  <TableCell className='flex justify-end'>
                    <Button
                      variant='outline'
                      size='sm'
                      className={isRtl ? "mr-2" : "ml-2"}
                      onClick={() => {
                        setEditMode(employee.id);
                        setNewEmployee(employee);
                      }}
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => deleteEmployee(employee.id)}
                    >
                      {t("delete")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
