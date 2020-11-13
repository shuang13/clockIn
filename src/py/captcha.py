import cv2
import sys
def helper_reshape(origin,jigsaw):
    """
    get top and bottom of the input image
    :param jigsaw: 却块
    :param origin: 原始图像with却块
    """
    H,W = jigsaw.shape[0],jigsaw.shape[1]
    bottom,top = H,H
    for i in range(0,H):
        temp = jigsaw[i]
        if max(temp) ==255:
            top = i-3
            break
    for i in range(H-1,0,-1):
        if max(jigsaw[i]) !=0:
            bottom = i+3
            break
    origin = origin[top:bottom]
    jigsaw = jigsaw[top:bottom]
    return origin,jigsaw

def FindPic_offset(target, template):
    """
    找出图像中最佳匹配位置
    :param target: 目标即背景图
    :param template: 模板即需要找到的图
    :return: 返回最佳匹配对应的X偏移
    """

    target_gray = cv2.cvtColor(target, cv2.COLOR_BGR2GRAY)
    template_rgb = template
    # cv2.imwrite("C:\\Users\\angus\\Desktop\\pics\\gray1.jpg",target_gray)
    # cv2.imwrite("C:\\Users\\angus\\Desktop\\pics\\gray2.jpg", template_rgb)

    temp1, orith = cv2.threshold(target_gray, 240, 255, cv2.THRESH_BINARY)
    temp2 , templateth = cv2.threshold(template_rgb, 252, 255, cv2.THRESH_BINARY)
    orith,templateth =  helper_reshape(orith,templateth)
    # cv2.imwrite("C:\\Users\\angus\\Desktop\\pics\\binary.jpg", orith)
    # cv2.imwrite("C:\\Users\\angus\\Desktop\\pics\\binary2.jpg", templateth)
    res = cv2.matchTemplate(orith, templateth, cv2.TM_CCOEFF_NORMED)
    value = cv2.minMaxLoc(res)

    return value[3][0]
def main():
    target = cv2.imread(sys.argv[1])
    template = cv2.imread(sys.argv[2],0)
    ret = FindPic_offset(target,template)
    print(ret)
if __name__ == '__main__':
    main()
