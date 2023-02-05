import { AxiosResponse } from "axios";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import api from "../services/api";

interface TaskProviderProps{
    children: ReactNode
}

interface TaskRequest{
    nome: string
    telefone: string
    email: string
    //completed: boolean
}

interface TaskResponse extends TaskRequest{
    id: string
    createdAt: Date
    updatedAt: Date
}

interface TaskPatch{
    name?: string,
    email?: string,
    telefone?: string
}

interface TaskContextData{
    tasks: TaskResponse[]
    createTask: (data:TaskRequest, token: string) => Promise<void>
    loadTasks: (token: string) => Promise<void>
    deleteTask: (taskId:string ,token: string) => Promise<void>
    updateTask: (data:TaskPatch, taskId: string, token:string) => Promise<void>
}

const TaskContext = createContext<TaskContextData>({} as TaskContextData)

const useTasks = () =>{
    const context = useContext(TaskContext)

    if(!context){
        throw new Error('useTasks must be used within an TaskProvide')
    }
    return context
}

const TaskProvider = ({children}:TaskProviderProps) =>{
    const [tasks, setTasks] = useState<TaskResponse[]>([])

    const loadTasks = useCallback(async (token:string) =>{
    // const [pagination, setPagination] = useState({})
        try{
            const response = await api.get('/clients/contacts',{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setTasks(response.data.data)
            //fazer paginação setPagination(response.data.info)
        }catch(err){
            console.log(err)
        }
    },[])

    const createTask = useCallback(async (data:TaskRequest,token:string) =>{
       await api.post('/contacts',data, {
            headers:{
                Authorization: `Bearer ${token}`
            }
        }).then((response:AxiosResponse<TaskResponse>) => setTasks((oldTask) => [...oldTask, response.data]))
        .catch(err => console.log(err))
    },[])

    const deleteTask = useCallback(async (taskId: string, token:string)=>{
       await api.delete(`/contacts/${taskId}`,{
            headers:{
                Authorization: `Bearer ${token}`
            }
        })
        .then(_ => {
            const filteredTasks = tasks.filter(task => task.id !== taskId)
            setTasks(filteredTasks)
        })
        .catch(err => console.log(err)) 
    },[])

    const updateTask = useCallback(async(data: TaskPatch, taskId: string, token: string) =>{
       await api.patch(`contacts/${taskId}`,data,{
            headers:{
                Authorization: `Bearer ${token}`
            }
        })
        .then(res => {
            const filteredTasks = tasks.filter(task => task.id !== taskId)
            let task = tasks.find(task => task.id === taskId)

            if(task){
                Object.assign(task, res.data);
                setTasks([...filteredTasks, task])
                // setTasks([...filteredTasks, { ...task, ...res.data }]);
            }
        })
        .catch(err => console.log(err))
    },[])


    return(
        <TaskContext.Provider value={{
            tasks,
            createTask,
            loadTasks,
            deleteTask,
            updateTask
            }}>
            {children}
        </TaskContext.Provider>
    )
}

export {useTasks, TaskProvider}