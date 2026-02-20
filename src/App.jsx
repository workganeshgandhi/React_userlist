import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Layout,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Typography,
  Space,
  message,
} from "antd";

const { Content } = Layout;
const { Title } = Typography;

function App() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editedUsers, setEditedUsers] = useState({});
  const [form] = Form.useForm();
  const [msgApi, msgContext] = message.useMessage();

  const loadUsers = async () => {
    const { data } = await axios.get("https://dummyjson.com/users");
    setUsers(data.users);
    setEditedUsers({});
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setEditedUsers((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    msgApi.success("User deleted");
  };


  const handleAdd = (values) => {
    const newUser = {
      id: Date.now(),
      firstName: values.firstName,
      lastName: values.lastName,
      company: { name: values.companyName, title: values.companyTitle },
      address: { country: values.country },
    };
    setUsers((prev) => [...prev, newUser]);
    setIsModalOpen(false);
    form.resetFields();
    setSearchTerm("");
    msgApi.success("User added");
  };

  const filteredUsers = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const companyName = user.company?.name?.toLowerCase() || "";
      const companyTitle = user.company?.title?.toLowerCase() || "";
      const country = user.address?.country?.toLowerCase() || "";
      return (
        fullName.includes(search) ||
        companyName.includes(search) ||
        companyTitle.includes(search) ||
        country.includes(search)
      );
    });
  }, [users, searchTerm]);

  const handleEdit = (id, field, value) => {
    setEditedUsers((prev) => {
      const current = prev[id] || {};
      switch (field) {
        case "firstName":
          return { ...prev, [id]: { ...current, firstName: value } };
        case "lastName":
          return { ...prev, [id]: { ...current, lastName: value } };
        case "companyName":
          return {
            ...prev,
            [id]: { ...current, company: { ...current.company, name: value } },
          };
        case "companyTitle":
          return {
            ...prev,
            [id]: { ...current, company: { ...current.company, title: value } },
          };
        case "country":
          return {
            ...prev,
            [id]: { ...current, address: { ...current.address, country: value } },
          };
        default:
          return prev;
      }
    });
  };

  const handleSaveAll = () => {
    setUsers((prev) =>
      prev.map((user) => (editedUsers[user.id] ? { ...user, ...mergeNested(user, editedUsers[user.id]) } : user))
    );
    setEditedUsers({});
    msgApi.success("All changes saved");
  };

  const mergeNested = (original, updates) => {
    const newObj = { ...updates };
    if (updates.company) newObj.company = { ...original.company, ...updates.company };
    if (updates.address) newObj.address = { ...original.address, ...updates.address };
    return newObj;
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_, record) => {
        const edit = editedUsers[record.id] || {};
        return (
          <Space>
            <Input
              value={edit.firstName ?? record.firstName}
              onChange={(e) => handleEdit(record.id, "firstName", e.target.value)}
              style={{ width: 100 }}
            />
            <Input
              value={edit.lastName ?? record.lastName}
              onChange={(e) => handleEdit(record.id, "lastName", e.target.value)}
              style={{ width: 100 }}
            />
          </Space>
        );
      },
      sorter: (a, b) =>
        (`${a.firstName} ${a.lastName}`).localeCompare(`${b.firstName} ${b.lastName}`),
    },
    {
      title: "Company",
      key: "company",
      render: (_, record) => {
        const edit = editedUsers[record.id]?.company || {};
        return (
          <Space>
            <Input
              value={edit.name ?? record.company?.name}
              onChange={(e) => handleEdit(record.id, "companyName", e.target.value)}
              style={{ width: 120 }}
            />
            <Input
              value={edit.title ?? record.company?.title}
              onChange={(e) => handleEdit(record.id, "companyTitle", e.target.value)}
              style={{ width: 120 }}
            />
          </Space>
        );
      },
      sorter: (a, b) => (a.company?.name || "").localeCompare(b.company?.name || ""),
    },
    {
      title: "Country",
      key: "country",
      render: (_, record) => {
        const edit = editedUsers[record.id]?.address || {};
        return (
          <Input
            value={edit.country ?? record.address?.country}
            onChange={(e) => handleEdit(record.id, "country", e.target.value)}
            style={{ width: 120 }}
          />
        );
      },
      sorter: (a, b) =>
        (a.address?.country || "").localeCompare(b.address?.country || ""),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button danger size="small" onClick={() => handleDelete(record.id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "40px 24px", maxWidth: 1100, margin: "0 auto" }}>
        {msgContext}
        <Title level={2}>User List</Title>

        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search by name, company, role, or country"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Button type="primary" onClick={() => setIsModalOpen(true)}>
            + Add User
          </Button>
          <Button onClick={loadUsers}>Refresh</Button>
          {Object.keys(editedUsers).length > 0 && (
            <Button type="default" onClick={handleSaveAll}>
              Save Changes
            </Button>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />

        <Modal
          title="Add User"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <Form layout="vertical" form={form} onFinish={handleAdd}>
            <Form.Item
              label="First Name"
              name="firstName"
              rules={[{ required: true, message: "Please input first name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Last Name"
              name="lastName"
              rules={[{ required: true, message: "Please input last name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Company Name"
              name="companyName"
              rules={[{ required: true, message: "Please input company name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Company Title"
              name="companyTitle"
              rules={[{ required: true, message: "Please input company title" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              label="Country"
              name="country"
              rules={[{ required: true, message: "Please input country" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Add
                </Button>
                <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
}

export default App;