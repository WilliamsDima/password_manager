import * as React from "react"
import Svg, { SvgProps, Path } from "react-native-svg"
import COLORS from "../../../services/colors"

const EyeCloseSvg = (props: SvgProps) => (
	<Svg
		width={22}
		height={22}
		viewBox='0 0 24 24'
		fill='none'
		xmlns='http://www.w3.org/2000/svg'
		{...props}
	>
		<Path
			d='m2.783 21 18.75-18M19.75 8.88a20.567 20.567 0 0 1 3.073 2.756 1.663 1.663 0 0 1 0 2.226c-2.566 2.824-6.724 5.706-10.824 5.637a9.986 9.986 0 0 1-3-.438M3.78 16.26a20.791 20.791 0 0 1-2.6-2.4 1.663 1.663 0 0 1 0-2.226C3.8 8.752 7.968 5.933 12 6a9.55 9.55 0 0 1 2.302.255'
			stroke={COLORS.GRAY}
			strokeWidth={1.5}
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<Path
			d='M12 9a3.749 3.749 0 0 0-3.75 3.714M12 16.5a3.75 3.75 0 0 0 3.75-3.727'
			stroke={COLORS.GRAY}
			strokeWidth={1.5}
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</Svg>
)

export default EyeCloseSvg
