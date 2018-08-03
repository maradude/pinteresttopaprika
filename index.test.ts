import { convertUrlToBoard, saveArrayToPaprika, getPins, getLinks } from './index'

test("convert url to board name", () => {
    expect(convertUrlToBoard('https://fi.pinterest.com/aukia/recipes-for-bbq/')).toBe("boards/aukia/recipes-for-bbq/pins")
});

