Throughtout the project, I actually didn't spend much time on UI/UX principles, because these concepts are very applicable in real life, so choices were made based on intuition rather than thought. Nonetheless, my main goal was to build a clean, cohesive experience because a webpage that looks nice is more likeley to be used in the long time.

One of the thigns we learnt in the lectires was about intimidation, which basically means that if your website feels intimidating, then people are less likeley to use it. So I paid special attention to alignment, spacing, typography, and color choices to avoid that.

For example, in the PastSessions component, I made sure the main content sits inside a centered, padded container (max-w-4xl mx-auto bg-white rounded-2xl shadow). This kind of framing really helps focus the user’s attention and prevents the page from feeling chaotic.

Typography-wise, I kept things simple and consistent. Headings like “Past Sessions for Game {gameId}” use a larger, bold font (text-2xl font-bold) to establish a clear hierarchy. Less is more, so having less clutter on the screen decreases intimidation which is better. It helps that only the essential features were part of the specifications, as projects of larger sixes (like kahoot and news pages), would have a more difficult time being minimalist.

I also planned out a constrained color palette early on. Action buttons like “View Results” use a consistent blue (bg-blue-500 hover:bg-blue-600) to stand out and signal that they’re interactive. For error messages, I chose a red (text-red-500). Because this was a Kahoot-like quiz app, despite choosing much bolder colours (to suit the style and aim), sticking to a single palette with not as many colours helps to reduice noise.

When it comes to visual hierarchy, I was intentional about size, spacing, and alignment to guide users naturally through the page. Titles and purpose of the page is at the top, essential features such as navigation and logging out are small corners to the top as well, the actual content for the page is in the middle, and etra stuff is at the bottom.

Consistent spacing—like mb-4 margins and px-4 py-2 padding—also helps users understand the structure of each page at a glance. This way, the important elements (like headers and buttons) are balanced and don’t fight for attention.

Lastly, I made sure to follow best practices for affordances. Interactive elements clearly signal what they do. For example, buttons like “View Results” have explicit labels so users know exactly what action they’re taking. I didn't really have to avoid using ordinances that don't match their purpose (I have not watched enough lectures), but all in all this is a great feature to keep in mind.