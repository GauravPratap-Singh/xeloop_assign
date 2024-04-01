import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from './components/Modal'; // Assuming you have a Modal component for editing todo items
import './App.css';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const client = axios.create({
  baseURL: "http://localhost:8000"
});

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [registrationToggle, setRegistrationToggle] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [viewCompleted, setViewCompleted] = useState(false);
  const [sortByDeadlineAsc, setSortByDeadlineAsc] = useState(false);
  const [sortByDeadlineDesc, setSortByDeadlineDesc] = useState(false);
  const [todoList, setTodoList] = useState([]);
  const [modal, setModal] = useState(false);
  const [activeItem, setActiveItem] = useState({
    title: "",
    description: "",
    completed: false,
    deadline: ""
  });

  useEffect(() => {
    client.get("/api/user")
      .then(function(res) {
        setCurrentUser(res.data);
        refreshList();
      })
      .catch(function(error) {
        setCurrentUser(null);
      });
  }, []);

  function refreshList() {
    client.get("/api/todos/")
      .then((res) => setTodoList(res.data))
      .catch((err) => console.log(err));
  }

  function toggle() {
    setModal(!modal);
  }

  function handleSubmit(item) {
    toggle();
    
    if (item.id) {
      client.put(`/api/todos/${item.id}/`, item)
        .then((res) => refreshList());
      return;
    }
    client.post("/api/todos/", item)
      .then((res) => refreshList());
  }

  function handleDelete(item) {
    client.delete(`/api/todos/${item.id}/`)
      .then((res) => refreshList());
  }

  function createItem() {
    const item = { title: "", description: "", completed: false, deadline: "" };
    setActiveItem(item);
    toggle();
  }

  function editItem(item) {
    setActiveItem(item);
    toggle();
  }

  function displayCompleted(status) {
    setViewCompleted(status);
  }

  function toggleSortByDeadlineAsc() {
    setSortByDeadlineAsc(true);
    setSortByDeadlineDesc(false);
  }

  function toggleSortByDeadlineDesc() {
    setSortByDeadlineAsc(false);
    setSortByDeadlineDesc(true);
  }

  function update_form_btn() {
    if (registrationToggle) {
      document.getElementById("form_btn").innerHTML = "Register";
      setRegistrationToggle(false);
    } else {
      document.getElementById("form_btn").innerHTML = "Log in";
      setRegistrationToggle(true);
    }
  }

  function submitRegistration(e) {
    e.preventDefault();
    client.post(
      "/api/register",
      {
        email: email,
        username: username,
        password: password
      }
    ).then(function(res) {
      client.post(
        "/api/login",
        {
          email: email,
          password: password
        }
      ).then(function(res) {
        setCurrentUser(true);
        refreshList();
      });
    });
  }

  function submitLogin(e) {
    e.preventDefault();
    client.post(
      "/api/login",
      {
        email: email,
        password: password
      }
    ).then(function(res) {
      setCurrentUser(true);
      refreshList();
    });
  }

  function submitLogout(e) {
    e.preventDefault();
    client.post(
      "/api/logout",
      { withCredentials: true }
    ).then(function(res) {
      setCurrentUser(false);
    });
  }

  function renderTabList() {
    return (
      <div className="nav nav-tabs">
        <span
          onClick={() => displayCompleted(true)}
          className={viewCompleted ? "nav-link active" : "nav-link"}
        >
          Complete
        </span>
        <span
          onClick={() => displayCompleted(false)}
          className={viewCompleted ? "nav-link" : "nav-link active"}
        >
          Incomplete
        </span>
      </div>
    );
  }

  function renderItems() {
    let sortedItems = [...todoList];

    if (sortByDeadlineAsc) {
      sortedItems.sort((a, b) => (a.deadline > b.deadline ? 1 : -1));
    } else if (sortByDeadlineDesc) {
      sortedItems.sort((a, b) => (a.deadline < b.deadline ? 1 : -1));
    }

    const newItems = sortedItems.filter((item) => item.completed === viewCompleted);

    return newItems.map((item) => (
      <li
        key={item.id}
        className="list-group-item d-flex justify-content-between align-items-center"
      >
        <span className={`todo-title mr-2 ${viewCompleted ? "completed-todo" : ""}`} title={item.description}>
          {item.title}
        </span>
        <span>
          <button className="btn btn-secondary mr-2" onClick={() => editItem(item)}>Edit</button>
          <button className="btn btn-danger" onClick={() => handleDelete(item)}>Delete</button>
        </span>
      </li>
    ));
  }

  return (
    <main className="container">
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>Task Manager App</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              {currentUser ? (
                <form onSubmit={submitLogout}>
                  <Button type="submit" variant="Dark">Log out</Button>
                </form>
              ) : (
                <Button id="form_btn" onClick={update_form_btn} variant="Dark">Register</Button>
              )}
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {currentUser ? (
        <>
          <h1 className="text-dark text-capitalize text-center my-4">Task List</h1>
          <div className="row">
            <div className="col-md-6 col-sm-10 mx-auto p-0">
              <div className="card p-3">
                <div className="mb-4">
                  <button className="btn btn-primary" onClick={createItem}>Add Task</button>
                  <button className="btn btn-success ml-2" onClick={toggleSortByDeadlineAsc}>Sort by Deadline (Asc)</button>
                  <button className="btn btn-warning ml-2" onClick={toggleSortByDeadlineDesc}>(Desc)</button>
                </div>
                {renderTabList()}
                <ul className="list-group list-group-flush border-top-0">
                  {renderItems()}
                </ul>
              </div>
            </div>
          </div>
          {modal && (
            <Modal
              activeItem={activeItem}
              toggle={toggle}
              onSave={handleSubmit}
            />
          )}
        </>
      ) : (
        <div className="center">
          <h2>Welcome! Please log in or register.</h2>
          <Form onSubmit={registrationToggle ? submitRegistration : submitLogin}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email address <span style={{ color: 'red' }}>Ex:- admin@gmail.com</span></Form.Label>
              <Form.Control type="email" placeholder="Enter email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Form.Text className="text-muted">
                We'll never share your email with anyone else.
              </Form.Text>
            </Form.Group>
            {registrationToggle && (
              <Form.Group className="mb-3" controlId="formBasicUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} />
              </Form.Group>
            )}
            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Password <span style={{ color: 'red' }}>pass:- admin</span></Form.Label>
              <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Form.Group>
            <Button variant="primary" type="submit">
              {registrationToggle ? "Register" : "Log in"}
            </Button>
          </Form>
        </div>
      )}
    </main>
  );
}

export default App;
