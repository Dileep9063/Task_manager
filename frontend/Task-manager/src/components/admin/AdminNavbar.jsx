import { useEffect, useState } from "react";
import axios from "axios";
import { FaBars } from "react-icons/fa";

import ThemeToggle from "./ThemeToggle";
import "./AdminNavbar.css";
import { API_BASE_URL } from "../../config/api";


function AdminNavbar({ onToggleSidebar, onLogout }){


    const [admin,setAdmin] = useState({

        name:"",
        role:""

    });





    useEffect(()=>{

    const loadAdminProfile = async()=>{

        try{

            const token = localStorage.getItem("token");

            const response = await axios.get(

                `${API_BASE_URL}/api/admin/profile`,

                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }

            );

            setAdmin(response.data);

        }

        catch(error){

            console.log(error);

        }

    };

    loadAdminProfile();

},[]);









    return(


        <header className="admin-navbar">



            <div className="navbar-left">


                {/* Opens/closes the sidebar drawer, mobile only */}

                <button
                    className="sidebar-toggle-btn"
                    onClick={() => { console.log("hamburger clicked"); onToggleSidebar(); }}
                    aria-label="Toggle navigation"
                >
                    <FaBars />
                </button>


                <div className="navbar-heading">
                    <span className="navbar-eyebrow">Admin console</span>
                    <h2 className="navbar-title">
                        Welcome back{admin.name ? `, ${admin.name.split(" ")[0]}` : ""}
                    </h2>
                </div>



            </div>








            {/* Admin details always visible. Logout sits beside it on
                desktop, but is hidden here on mobile (moved into the
                sidebar drawer instead) */}

            <div className="navbar-right">

                <ThemeToggle />



                <div className="profile">


                    <h4>

                        {

                            admin.name || "Administrator"

                        }

                    </h4>



                    <p>

                        {

                            admin.role || "Admin"

                        }

                    </p>


                </div>







                <button

                    className="logout-btn"

                    onClick={onLogout}

                >

                    Logout


                </button>





            </div>





        </header>


    );


}


export default AdminNavbar;
