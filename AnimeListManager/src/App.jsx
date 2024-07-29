import './App.css'
import Footer from './components/Footer'
import Manager from './components/Manager'
import Navbar from './components/Navbar'
/* Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
Set-ExecutionPolicy -ExecutionPolicy Default -Scope Process */

function App() {

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        {/* <div class="absolute top-0 z-[-2] h-screen w-screen bg-[#000000] bg-[radial-gradient(#ffffff33_1px,#00091d_1px)] bg-[size:20px_20px]"></div>    */}
        <Manager />
        <Footer />
      </div>
    </>
  )
}

export default App
