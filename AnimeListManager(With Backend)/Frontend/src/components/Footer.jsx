import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
      <div className="container mx-auto flex flex-col gap-1">
        <p><span className='text-[#E67E22]'>Anime</span>ListManager - Created with Love ❤️ and Passion</p>
        <p className="text-xs text-gray-400">
          Anime data provided by{' '}
          <a
            href="https://myanimelist.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#E67E22] hover:underline"
          >
            MyAnimeList
          </a>
        </p>
      </div>
    </footer>
  )
}

export default Footer