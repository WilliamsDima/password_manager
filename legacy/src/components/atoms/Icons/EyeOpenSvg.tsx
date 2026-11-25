import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
import COLORS from "../../../services/colors"

const EyeOpenSvg = (props: SvgProps) => (
	<Svg
		width={22}
		height={22}
		viewBox='0 -0.5 25 25'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<Path
			d='M12 5.251C7.97 5.183 3.8 8 1.18 10.885a1.663 1.663 0 0 0 0 2.226C3.742 15.935 7.9 18.817 12 18.748c4.1.069 8.258-2.813 10.824-5.637a1.663 1.663 0 0 0 0-2.226C20.2 8 16.031 5.183 12 5.251Z'
			stroke={COLORS.GRAY}
			strokeWidth={1.5}
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<Path
			d='M15.75 12a3.75 3.75 0 1 1-7.5-.002 3.75 3.75 0 0 1 7.5.002Z'
			stroke={COLORS.GRAY}
			strokeWidth={1.5}
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</Svg>
)

export default EyeOpenSvg
